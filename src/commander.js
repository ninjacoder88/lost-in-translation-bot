const translator = require("./translator");

module.exports = {
	handlePingCommand: function(channelName, chat){
		chat(channelName, "PONG");
	},

	handleHelpCommand: function(channelName, chat){
		chat(channelName, "For a list of commands, visit https://lostintranslationbot.com");
	},

	handleHelloCommand: function(channelName, chat){
		chat(channelName, "Hey there! I'm LITBOT 2.0. I am a bot that helps moderate and makes chat more accessible by translating chat to the streamer's language of choice. For more information visit https://lostintranslationbot.com");
	},

	handleOnCommand: function(channelName, isMod, updateConfiguration, log, chat){
		if(isMod === false){
			return;
		}

		updateConfiguration(channelName, (config) => {
			config.state = "on";
		});
		log(`turned on for ${channelName}`);
		chat(channelName, "LITBOT is ready to translate your chat");
	},

	handleOffCommand: function(channelName, isMod, updateConfiguration, log, chat){
		if(isMod === false){
			return;
		}
		
		updateConfiguration(channelName, (config) => {
			config.state = "off";
		});
		log(`turned off for ${channelName}`);
		chat(channelName, "LITBOT will no longer translate your chat messages");
	},

	handleTranslateCommand: function(channelName, message, username, appConfiguration, log, chat){
		const text = message.substring(18);

		translator.translate(text, "en", appConfiguration, log)
			.then(translation => {
				if(translation === undefined){
					return;
				}
				
				chat(channelName, `${username} => (${translation.detectedLanguageCode}) ${translation.translatedText}`);
			}).catch(error => {
				log(error);
			});
	},

	handleWordCommand: function(channelName, isMod, splitMessage, log){
		if(isMod === false){
			return;
		}

		const wordSubCommand = splitMessage[2];
		const wordWord = splitMessage[3];

		if(wordWord === undefined){
			return;
		}

		switch(wordSubCommand){
			case "add":
				log(`added ${wordWord} to ${channelName}`);
				break;
			case "remove":
				log(`removed ${wordWord} to ${channelName}`);
				break;
		}
	},

	handleUserCommand: function(channelName, isMod, splitMessage, updateConfiguration, log, chat){
		if(isMod === false){
			return;
		}

		const userSubCommand = splitMessage[2];
		const userUsername = splitMessage[3];

		if(userUsername === undefined){
			return;
		}

		switch(userSubCommand){
			case "exclude":
				updateConfiguration(channelName, (config) => {
					if(config.excludedUsers.indexOf(userUsername) >= 0){
						return;
					}

					config.excludedUsers.push(userUsername);

					const iIndex = config.includedUsers.indexOf(userUsername);
					if(iIndex >= 0){
						config.includedUsers.splice(iIndex, 1);
					}

					delete config.watchedUsers[userUsername];
					log(`excluded ${userUsername} from being translated from ${channelName}`);
					chat(channelName, `${userUsername}'s messages will no longer be translated`);
				});
				break;
			case "include":
				updateConfiguration(channelName, (config) => {
					if(config.includedUsers.indexOf(userUsername) >= 0){
						return;
					}

					config.includedUsers.push(userUsername);

					const eIndex = config.excludedUsers.indexOf(userUsername);
					if(eIndex >= 0){
						config.excludedUsers.splice(eIndex, 1);
					}

					delete config.watchedUsers[userUsername];
					log(`include ${userUsername} to be translated for ${channelName}`);
					chat(channelName, `${userUsername}'s messages will always be translated`);
				});
				break;
			case "reset":
				updateConfiguration(channelName, (config) => {
					const eIndex = config.excludedUsers.indexOf(userUsername);
					const iIndex = config.includedUsers.indexOf(userUsername);

					if(eIndex >= 0){
						config.excludedUsers.splice(eIndex, 1);
					}

					if(iIndex >= 0){
						config.includedUsers.splice(iIndex, 1);
					}

					delete config.watchedUsers[userUsername];
					log(`reset ${userUsername} for ${channelName}`);
					chat(channelName, `${userUsername}'s messages will be translated when necessary`);
				});
				break;
		}
	},

	handleReplyAsCommand: function(channelName, isMod, splitMessage, currentReplyAs, updateConfiguration, log, chat){
		if(isMod === false){
			return;
		}

		const replyAsSetting = splitMessage[2];

		switch(replyAsSetting){
			case undefined:
				chat(channelName, `LITBOT reply as is set to ${currentReplyAs}`);
				break;
			case "chat":
				updateConfiguration(channelName, (config) => {
					config.replyAs = "chat";
				});
				log(`set reply as to ${replyAsSetting} for ${channelName}`);
				chat(channelName, `reply as set to ${replyAsSetting}`);
				break;
			case "whisper":
				updateConfiguration(channelName, (config) => {
					config.replyAs = "whisper";
				});
				log(`set reply as to ${replyAsSetting} for ${channelName}`);
				chat(channelName, `reply as set to ${replyAsSetting}`);
				break;
		}
	},

	handleLangCommand: function(channelName, isMod, splitMessage, supportedLanguages, updateConfiguration, log, chat){
		const langSubCommand = splitMessage[2];
		const langCode = splitMessage[3];

		switch(langSubCommand){
			case undefined:
				const languages = supportedLanguages.join(",");
				chat(channelName, `${channelName} currently supports the following langugages: ${languages}`);
				break;
			case "add":
				if(isMod === false){
					break;
				}

				if(langCode === undefined){
					break;
				}

				updateConfiguration(channelName, (config) => {
					const addIndex = config.languages.indexOf(langCode);
					if(addIndex >= 0){
						return;
					}

					config.languages.push(langCode);
					log(`added ${langCode} to ${channelName}`);
					chat(channelName, `added ${langCode}`);
				});
				break;
			case "remove":
				if(isMod === false){
					break;
				}

				if(langCode === undefined){
					break;
				}

				updateConfiguration(channelName, (config) => {
					const removeIndex = config.languages.indexOf(langCode);
					if(removeIndex < 0){
						return;
					}

					config.languages.splice(removeIndex, 1);
					log(`removed ${langCode} from ${channelName}`);
					chat(channelName, `removed ${langCode}`);
				});
				break;
		}
	},

	handleModeCommand: function(channelName, isMod, splitMessage, currentMode, updateConfiguration, log, chat){
		if(isMod === false){
			return;
		}

		const modeSetting = splitMessage[2];

		switch(modeSetting){
			case undefined:
				chat(channelName, `LITBOT mode is set to ${currentMode}`);
				break;
			case "translate":
				updateConfiguration(channelName, (config) => {
					config.mode = "translate";
				});
				log(`set mode to ${modeSetting} for ${channelName}`);
				chat(channelName, `mode set to ${modeSetting}`);
				break;
			case "moderate":
				updateConfiguration(channelName, (config) => {
					config.mode = "moderate";
				});
				log(`set mode to ${modeSetting} for ${channelName}`);
				chat(channelName, `mode set to ${modeSetting}`);
				break;
		}
	}
}
