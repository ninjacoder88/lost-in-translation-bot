import asyncio
import time
import json
from websockets.sync.client import connect
from threading import Thread

address = "ws://irc-ws.chat.twitch.tv:80"

def getIt(message):
    serverStart = message.find(":")
    serverEnd = message.find(" ", serverStart)
    commandStart = serverEnd + 1
    commandEnd = message.find(" ", commandStart)
    command = message[commandStart:commandEnd]
    return command

def listen(config):
    with connect(address) as websocket:
        websocket.send("PASS oauth:" + config["irc_oauth_token"])
        websocket.send("NICK " + config["twitch_username"])

        while True:
            message = websocket.recv()
            print(message)
            cmd = getIt(message)

            if cmd == "001":
                print("connected succesfully")
                websocket.send("JOIN #ninjacoder88")
                websocket.send("PRIVMSG #ninjacoder88 hello")
            if cmd == "JOIN":
                print("joined successfully")
            if cmd == "PING":
                a = message.find(" ")
                b = message[a+1:]
                print(b)
                websocket.send("PONG {b}")

f = open("../app/secrets.json", "r")
d = f.read()
o = json.loads(d)

listen(o)
