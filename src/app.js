const tmi = require("tmi.js");
const fs = require("fs");
const https = require("https");
const { TranslationServiceClient } = require("@google-cloud/translate");
const commander = require("./commander");
const translator = require("./translator");

const appConfigurationJson = fs.readFileSync("secrets.json");
const appConfiguration = JSON.parse(appConfigurationJson);

const ircClient = new tmi.client({
    identity: {
        username: appConfiguration["twitch_username"],
        password: `oauth:${appConfiguration["irc_oauth_token"]}`
    }
});

const configurations = {};
const configUpdates = {};

function updateConfig(channelName, update){
	if(configUpdates[channelName] === undefined){
		configUpdates[channelName] = true;
	}

	if(configUpdates[channelName] === true){
		setTimeout(() => {
			update(configurations[channelName]);
		}, 500);
	} else {
		update(configurations[channelName]);
	}
}

function writeToChat(channel, message){
	ircClient.say(channel, message)
		.catch(error => {
			log(error)
		});
}

function log(message){
	const d = new Date();
	console.log(`${d.toISOString()} | ${message}`);
}

function handleCommand(cleanMessage, channel, isMod, username){
	const splitMessage = cleanMessage.split(" ");
    const command = splitMessage[1];

    switch(command){
	    case "hello":
			commander.handleHelloCommand(channel, writeToChat);
	   	    break;
        case "translate":
			commander.handleTranslateCommand(channel, cleanMessage, username, appConfiguration, log, writeToChat);
    	    break;
	    case "help":
			commander.handleHelpCommand(channel, writeToChat);
      	    break;
		case "lang":
			const currentLanguages = configurations[channel].languages;
			commander.handleLangCommand(channel, isMod, splitMessage, currentLanguages, updateConfig, log, writeToChat);
			break;
		case "mode":
			const currentMode = configurations[channel].mode;
			commander.handleModeCommand(channel, isMod, splitMessage, currentMode, updateConfig, log, writeToChat);
			break;
		case "replyas":
			const currentReplyAs = configurations[channel].replyAs;
			commander.handleReplyAsCommand(channel, isMod, splitMessage,currentReplyAs, updateConfig, log, writeToChat);
			break;
		case "user":
			commander.handleUserCommand(channel, isMod, splitMessage, updateConfig, log, writeToChat);
			break;
		case "word":
			commander.handleWordCommand(channel, isMod, splitMessage, log);
			break;
		case "off":
			commander.handleOffCommand(channel, isMod, updateConfig, log, writeToChat);
			break;
		case "on":
			commander.handleOnCommand(channel, isMod, updateConfig, log, writeToChat);
			break;
		case "ping":
			commander.handlePingCommand(channel, writeToChat);
			break;
	}
}

function handleMessage(cleanMessage, context, channel){
	const config = configurations[channel];
	if(config.state !== "on"){
		return;
	}
	if(config.languages.length === 0){
		return;
	}
	if(config.replyAs !== "chat"){
		return;
	}

	//TODO: check other config values

	const userIsMod = context.mod || channel == `#${context.username}`;
	const userIsSub = context.subscriber;
	const userIsVip = false;
	const userIsFounder = false;
	const messageIsOnlyEmotes = context["emotes-only"] === true;
	
	// context.emotes => {'1': ['2-3'], '30259': ['9-15']}
	// context["emotes-raw"] => '1:2-3/30259:9-15'
	if(context["emotes-raw"] !== null && context["emotes-raw"] !== undefined){
		const emotes = context["emotes-raw"].split("/");
		let splitMessage = cleanMessage.split("");
		emotes.reverse().forEach(emote => {
			const positionsRaw = emote.split(":")[1];
			positionsRaw.split(",").reverse().forEach(pos => {
				const p = pos.split("-");
				const b = parseInt(p[0]);
				const e = parseInt(p[1]);
				const l = e - b + 2;
				splitMessage.splice(b, l);
			});
		});

		cleanMessage = splitMessage.join("");
	}

	const strArr = cleanMessage.split(" ");
//	console.log(strArr);
	const newStrArr = [];
	strArr.forEach(w => {
//		console.log(w);
		if(w.indexOf("https://") !== -1){
			return;
		}
//		console.log(w);

		if(w.indexOf("http://") !== -1){
			return;
		}
//		console.log(w);

		newStrArr.push(w);
	});
//	console.log(newStrArr);

	cleanMessage = newStrArr.join(" ").trim();

//	console.log(cleanMessage);

	if(cleanMessage.length === 0){
		return;
	}


	if(config.includedUsers.indexOf(context.username) >= 0){
		translator.translate(cleanMessage, "en", appConfiguration, log)
			.then(translation => {
				if(translation === undefined){
					return;
				}

				writeToChat(channel, `${context.username} (${translation.detectedLanguageCode}) => ${translation.translatedText}`);
			}).catch(error => {
				log(error);
			});
		return;
	}

	if(userIsMod || userIsSub || userIsVip || userIsFounder){
		return;
	}

	if(config.excludedUsers.indexOf(context.username) >= 0){
		return;
	}

	if(messageIsOnlyEmotes === true){
		return;
	}

	//TODO: remove approved words
	//TODO: remove links
	

	translator.translate(cleanMessage, "en", appConfiguration, log)
		.then(translation => {
			if(translation != undefined){
				writeToChat(channel, `${context.username} (${translation.detectedLanguageCode}) => ${translation.translatedText}`);
			}

			updateConfig(channel, (c) => {
				if(c.watchedUsers[context.username] === undefined){
					c.watchedUsers[context.username] = 0;
				}

				if(translation === undefined){
					c.watchedUsers[context.username]++;
				} else {
					c.watchedUsers[context.username] = 0;
				}

				if(c.watchedUsers[context.username] === 3){
					c.excludedUsers.push(context.username);
					delete c.watchedUsers[context.username];
				}
			});
		}).catch(error => {
			log(error);
		});
}

ircClient.on("message", (channel, context, message, self) => {
    if(self === true){
        return;
    }

    log(`${channel} | ${context.username} | ${message}`);

	const channelName = channel.substring(1);

	try {    
    	const cleanMessage = message.toLowerCase().trim();
		const isCommand = cleanMessage.startsWith("!litbot") === true;

	    if(isCommand){
	        //handle the command
			const isMod = context.mod || channelName === context.username;
			handleCommand(cleanMessage, channelName, isMod, context.username);
			return;
    	}
    
		//handle the message
		handleMessage(cleanMessage, context, channelName);
	} catch (error) {
		log(error);
	}
});

function getTwitchStreams(channelNames, twitchApiClientId, twitchApiToken){
	const queryString = channelNames.map(c => `&user_login=${c}`).join("").substring(1);

	const requestOptions = {
		hostname: "api.twitch.tv",
		port: 443,
		path: `helix/streams?${queryString}`,
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${twitchApiToken}`,
			"Client-Id": twitchApiClientId
		}
	};

	return new Promise((resolve, reject) => {
		const request = https.request(requestOptions, response => {
			response.on("data", rawData => {
				const obj = JSON.parse(rawData);
				resolve(obj.data);
			});
		});

		request.on("error", error => {
			reject(error);
		});

		request.end();
	});
}

function saveConfigurations(){	
	try {
		for(let [channelName, locked] of Object.entries(configUpdates)){
			try {
				configUpdates[channelName] = true;

				const j = JSON.stringify(configurations[channelName]);
				fs.writeFile(`channels/${channelName}.json`, j, err => {
					if(err){
						log(err);
					} else {
						log(`updated configuration for ${channelName}`);
					}

					delete configUpdates[channelName];
				});
			} catch(error) {
				log(error);
			}
		}
	} catch(er) {
		log(er);
	}
}

function initializeChannelConfiguration(channelName){
	try {
		const exists = fs.existsSync(`channels/${channelName}.json`);
		if(exists === false){
			log(`no file exists for ${channelName}, creating new file from template`);
			fs.copyFileSync("channels/template.json", `channels/${channelName}.json`);
		}

		const channelJson = fs.readFileSync(`channels/${channelName}.json`);
		const channelConfig = JSON.parse(channelJson);

		configurations[channelName] = channelConfig;
	} catch(error) {
		log(error);
	}
}

function setupChannel(twitchStream){
	if(twitchStream.type !== "live"){
		return false;
	}

	const channelName = twitchStream["user_login"];

	if(configurations[channelName] !== undefined){
		return true;
	}

	initializeChannelConfiguration(channelName);

	ircClient.join(channelName)
		.then(joinedChannel => {
			log(`joined ${joinedChannel}`);
		}).catch(error => {
			log(error);
		});

	return true;
}

function setupChannels(){

 	const channelsJson = fs.readFileSync("channels.json");
	const channelNames = JSON.parse(channelsJson);

	getTwitchStreams(channelNames, appConfiguration["twitch_api_client_id"], appConfiguration["twitch_api_token"])
		.then(twitchStreams => {
			const liveChannels = [];
			twitchStreams.forEach(ts => {
				const isLive = setupChannel(ts);
				if(isLive === true){
					liveChannels.push(ts["user_login"]);
				}
			});

			for(let [channelName, v] of Object.entries(configurations)){
				if(liveChannels.indexOf(channelName) === -1){
					ircClient.part(channelName)
						.then(() => {
							log(`left ${channelName}`);
							delete configurations[channelName];
						}).catch(error => {
							log(error);
						});
				}
			}
		}).catch(error => {
			log(error);
		});
}


ircClient.connect()
    .then(server => {
        log(server);
		setupChannels();
    }).catch(error =>{
        log(error);
    });

//TODO: get the lang from the twitch api
//TODO: implement whisper
//TODO: implement moderate

setInterval(function(){
	saveConfigurations();
}, 60000);

setInterval(function() {
	setupChannels();
}, 300000);

