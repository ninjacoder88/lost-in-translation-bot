const https = require("https");
const fs = require("fs");

const appConfigJson = fs.readFileSync("secrets.json");
const appConfig = JSON.parse(appConfigJson);

const client_id = appConfig["twitch_api_client_id"];
const client_secret = appConfig["twitch_api_client_secret"];

const options = {
    hostname: "id.twitch.tv",
    port: 443,
    path: `/oauth2/token?client_id=${client_id}&client_secret=${client_secret}&grant_type=client_credentials`,
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Client-Id": `${client_id}`
    }
};

const request = https.request(options, response => {
    response.on("data", d => {
        console.log(JSON.parse(d));
    });

    response.on("error", error => {
        console.log(error);
    });
});

request.end();
