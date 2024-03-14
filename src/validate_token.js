const https = require("https");
const fs = require("fs");

const appConfigJson = fs.readFileSync("secrets.json");
const appConfig = JSON.parse(appConfigJson);

const options = {
    hostname: "id.twitch.tv",
    port: 443,
    path: `/oauth2/validate`,
    method: "GET",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `OAuth ${appConfig["twitch_api_token"]}`
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
