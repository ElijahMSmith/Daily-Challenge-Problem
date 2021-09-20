import { Channel } from "discord.js"

const { Client, Intents } = require("discord.js")
const { token } = require("../../config.json")
const client = new Client({ intents: [Intents.FLAGS.GUILDS] })

client.once("ready", () => {
	console.log("Daily Challenge Problem bot online.")

	// Only works once the bot is loaded
	const postChannel = client.channels.cache.find(
		(channel: { name: string }) =>
			channel.name === "daily-challenge-problem"
	)

	const messageProcess = setInterval(() => {
		if (!postChannel) console.log("Couldn't find channel!")
		else if (!postChannel.isText())
			console.log("This channel is required to be a text channel!")
		else postChannel.send("Test message!")
	}, 2000)

	setTimeout(() => {
		clearInterval(messageProcess)
	}, 10000)
})

client.login(token)
