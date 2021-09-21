import { runProcess } from "./problemFunctions"
import { getAllProblems } from "./requests"
import { Difficulty, OutputChannel, Problem } from "./utils/types"
import { Client, Intents } from "discord.js"
import dotenv from "dotenv"
import path from "path"
import fs from "fs"
import { getDifficultyString } from "./utils/utils"

dotenv.config()

const schedule = require("node-schedule")
const axios = require("axios").default
const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
})

// 24 hour clock
const triggerHour: number = 9,
	triggerMinute: number = 0

let rawConfig = fs.readFileSync(
	path.resolve(__dirname, "../../channel-config.json")
)
let channelData: Record<string, OutputChannel> = JSON.parse(
	rawConfig.toString()
)

// --------- Problem Storage ---------

let easyProblems: Problem[], mediumProblems: Problem[], hardProblems: Problem[]

let easyIndex = 0,
	mediumIndex = 0,
	hardIndex = 0

// --------- Main execution ---------

const generateNextProblems = async (): Promise<Problem[]> => {
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
	const allProblems: Problem[][] = await getAllProblems(axios)

	easyProblems = allProblems[0]
	mediumProblems = allProblems[1]
	hardProblems = allProblems[2]

	console.log(
		`Retrieved ${easyProblems.length} easy problems, ${mediumProblems.length} medium problems, and ${hardProblems.length} hard problems`
	)

	const rule = new schedule.RecurrenceRule()
	rule.hour = triggerHour
	rule.minute = triggerMinute

	schedule.scheduleJob(rule, () => {
		generateNextProblems()
		runProcess(
			client,
			[
				easyProblems[easyIndex],
				mediumProblems[mediumIndex],
				hardProblems[hardIndex],
			],
			channelData
		)
	})

	console.log(
		`Scheduled process for ${
			triggerHour % 12 == 0 ? 12 : triggerHour % 12
		}:${triggerMinute}${triggerMinute < 10 ? "0" : ""} ${
			triggerHour < 12 ? "AM" : "PM"
		}`
	)

	// //temp: testing
	// const soon = new Date(Date.now() + 2000)
	// const job = schedule.scheduleJob(soon, async () => {
	// 	console.log("Executing job")
	// 	await generateNextProblems()
	// 	await runProcess(
	// 		client,
	// 		[
	// 			easyProblems[easyIndex],
	// 			mediumProblems[mediumIndex],
	// 			hardProblems[hardIndex],
	// 		],
	// 		channelData
	// 	)
	// })

	console.log("Scheduled testing job")
})

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return

	const { commandName, options } = interaction

	if (commandName === "ping") {
		await interaction.reply(`Pong (${interaction.client.ws.ping}ms)`)
	} else if (commandName === "set-problem-channel") {
		// TODO - reply required to make interaction succeed
		const difficulty: string = options
			.getString("difficulty", true)
			.toLowerCase()
		const channelGroup: string = options
			.getString("channel-group", true)
			.toLowerCase()
		const channelName: string = options
			.getString("channel-name", true)
			.toLowerCase()

		// Should never happen since discord doesn't let you pick an invalid option
		if (!difficulty || !channelGroup || !channelName) {
			interaction.reply(
				"Couldn't set problem output channel, one or more options invalid."
			)
			return
		}

		channelData[difficulty].channelGroup = channelGroup
		channelData[difficulty].channelName = channelName
		fs.writeFileSync(
			path.resolve(__dirname, "../../channel-config.json"),
			JSON.stringify(channelData, null, 2)
		)

		interaction.reply(
			`Successfully updated ${difficulty} problems output channel to '#${channelName}' in group '${channelGroup}'`
		)
	} else if (commandName === "get-problem-channel") {
		const difficulty: string = options
			.getString("difficulty", true)
			.toLowerCase()

		console.log("Looking for output channel for '" + difficulty + "'")

		// Should never happen since discord doesn't let you pick an invalid option
		if (!difficulty) {
			interaction.reply(
				"Couldn't retrieve difficulty from command options!"
			)
			return
		}

		const correctChannelData: OutputChannel = channelData[difficulty]

		// Should never happen since discord doesn't let you pick an invalid option
		if (!correctChannelData) {
			interaction.reply(
				"Couldn't find a channel for the given difficulty!"
			)
			return
		}

		interaction.reply(
			`The ${difficulty} problems are being directed to the '#${correctChannelData.channelName}' in the group '${correctChannelData.channelGroup}'`
		)
	}
})

client.login(process.env.TOKEN)
