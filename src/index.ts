import { TextChannel } from "discord.js"
import { getChannels, sendProblems } from "./interactions"
import { getAllProblems } from "./requests"
import { Problem } from "./utils/types"
import { Client, Intents } from "discord.js"
import dotenv from "dotenv"

dotenv.config()

const schedule = require("node-schedule")
const axios = require("axios").default
const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
})

const easyProblems: Problem[] = []
const mediumProblems: Problem[] = []
const hardProblems: Problem[] = []

let easyIndex = 0,
	mediumIndex = 0,
	hardIndex = 0

// 24 hour clock
const triggerHour: number = 9,
	triggerMinute: number = 0

const runProcess = async function (): Promise<void> {
	const postChannels: TextChannel[] = getChannels(client)

	const currentProblems: Problem[] = generateProblems()

	console.log("-------------------------------------")
	console.log("Selected Problem Data: ")
	console.log(currentProblems)
	console.log("-------------------------------------")

	sendProblems(postChannels, currentProblems)
}

const generateProblems = (): Problem[] => {
	const newProblems: Problem[] = [
		easyProblems[easyIndex],
		mediumProblems[mediumIndex],
		hardProblems[hardIndex],
	]

	console.log(
		`Got the ${easyIndex + 1}/${easyProblems.length} easy problem, ${
			mediumIndex + 1
		}/${mediumProblems.length} medium problem, and the ${hardIndex + 1}/${
			hardProblems.length
		} hard problem`
	)

	easyIndex = (easyIndex + 1) % easyProblems.length
	mediumIndex = (mediumIndex + 1) % mediumProblems.length
	hardIndex = (hardIndex + 1) % hardProblems.length

	return newProblems
}

client.once("ready", async () => {
	console.log("Daily Challenge Problem bot online.")

	console.log("Attempting to get problem set...")
	await getAllProblems(axios, [easyProblems, mediumProblems, hardProblems])

	console.log(
		`Retrieved ${easyProblems.length} easy problems, ${mediumProblems.length} medium problems, and ${hardProblems.length} hard problems`
	)

	// const rule = new schedule.RecurrenceRule()
	// rule.hour = triggerHour
	// rule.minute = triggerMinute
	// schedule.scheduleJob(rule, runProcess)

	// console.log(
	// 	`Scheduled process for ${
	// 		triggerHour % 12 == 0 ? 12 : triggerHour % 12
	// 	}:${triggerMinute}${triggerMinute < 10 ? "0" : ""} ${
	// 		triggerHour < 12 ? "AM" : "PM"
	// 	}`
	// )

	//temp: testing
	const startTime = new Date(Date.now() + 1000)
	const endTime = new Date(startTime.getTime() + 1500)
	const job = schedule.scheduleJob(
		{ start: startTime, end: endTime, rule: "*/2 * * * * *" },
		runProcess
	)

	console.log("Scheduled testing job")
})

client.login(process.env.TOKEN)
