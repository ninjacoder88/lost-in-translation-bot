# lost-in-translation-bot
The following setup documentation is specific to the Raspberry Pi Model 3B+

# Common

## Set Up Raspberry Pi
- [ ] Download and install [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
- [ ] Select __Raspberry Pi 3__
- [ ] Select __Raspberry Pi OS (Other)__ -> __Raspberry Pi OS (Legacy, 64 bit)
- [ ] Select the appropriate storage device

## Setup Twitch
- [ ] Setup Twitch Application
- [ ] Get Twitch IRC Token
- [ ] Get Twitch API Token

## Install Software
- [ ] Update apt-get `sudo apt-get update`
- [ ] Install NeoVim `sudo apt-get install neovim`
- [ ] Install CA Certificates `sudo apt-get install apt-transport-https ca-certificates gnupg`
- [ ] [Setup GitHub SSH](#setup-github-ssh)
- [ ] [Install Google Cloud SDK](#install-google-cloud-sdk)
- [ ] [Install Twitch CLI](#install-twitch-cli)

## Setup LITBOT
- [ ] Follow language specific instructions
    - [JavaScript](#javascript)
    - [Python](#python)

### Setup GitHub SSH
https://docs.github.com/en/authentication/connecting-to-github-with-ssh

`ssh-keygen -t ed25519 -C "your_email@example.com"`

`eval "$(ssh-agent -s)"`

`ssh-add ~/.ssh/id_ed25519`
add to github account

verify the key works
`ssh -T git@github.com`

ensure the url for the repo is `git@github.com:ACCOUNT/PROJECT.git`

### Install Google Cloud SDK
`echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list`

`curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -`

`sudo apt-get update && sudo apt-get install google-cloud-sdk`

`gcloud init`

`gcloud auth application-default login`

### Install Twitch CLI
`https://github.com/twitchdev/twitch-cli/releases`

`https://github.com/twitchdev/twitch-cli/releases/download/v1.1.22/twitch-cli_1.1.22_Linux_arm64.tar.gz`

`tar -xvzf twitch-cli_1.1.22_Linux_arm64.tar.gz`

### Create Service
`cd /lib/systemd/system`
`sudo litbot.service`
```
[Unit]
Description=Lost in Translation Twitch Bot
After=network.target
StartLimitIntervalSec=1

[Service]
Type=simple
Restart=always
ExecStart=(SEE LANGUAGE SPECIFIC INSTRUCTIONS)
User=litbot
WorkingDirectory=/home/litbot/code/lost-in-translation-bot/app

[Install]
WantedBy=default.target
```

`systemctl start litbot`
`systemctl status litbot`
`systemctl stop litbot`
`systemctl restart litbot`

# JavaScript

## Install NodeJS
`curl -fsSL https://deb.nodesource.com/setup_14.x | bash -`

`sudo apt-get install -y nodejs`

## Install npm Packages in project directory
`npm install tmi.js`

`npm install "@google-cloud/translate"`

### Create Service
/usr/bin/node /home/litbot/code/lost-in-translation-bot/src/app.js


# Python
Raspberry Pi OS comes with Python installed by default

### Create Service