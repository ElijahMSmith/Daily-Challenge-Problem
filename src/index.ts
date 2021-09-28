import { runProcess } from "./problemFunctions"
import { getAllProblems } from "./requests"
import { OutputChannel, Problem } from "./utils/types"
import { ApplicationCommand, Client, Guild, Intents } from "discord.js"
import dotenv from "dotenv"
import path from "path"
import fs from "fs"

dotenv.config()

const schedule = require("node-schedule")
const axios = require("axios").default
const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_INTEGRATIONS,
	],
})

// 24 hour clock
let triggerHour: number = 9,
	triggerMinute: number = 0

let rawConfig = fs.readFileSync(
	path.resolve(__dirname, "../../configs/channel-config.json")
)
let channelData: Record<string, OutputChannel> = JSON.parse(
	rawConfig.toString()
)

rawConfig = fs.readFileSync(
	path.resolve(__dirname, "../../configs/schedule-config.json")
)
let scheduleData = JSON.parse(rawConfig.toString())

triggerHour = scheduleData.hour
triggerMinute = scheduleData.minute

rawConfig = fs.readFileSync(
	path.resolve(__dirname, "../../configs/permissions-config.json")
)
let permissionsData = JSON.parse(rawConfig.toString())

let setTimeRoles: string[] = permissionsData.setTime.havePermission
let setChannelRoles: string[] = permissionsData.setTime.havePermission

// --------- Problem Storage ---------

let easyProblems: Problem[], mediumProblems: Problem[], hardProblems: Problem[]

let easyIndex = 0,
	mediumIndex = 0,
	hardIndex = 0

// --------- Main execution ---------

let runningJob: any

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

	const guild: Guild = client.guilds.cache.get(process.env.GUILD_ID)
	let guildCommands = (await guild.commands.fetch()).filter(
		(command) =>
			command.name === "set-problem-channel" ||
			command.name === "set-send-time"
	)

	for (let collectionObj of guildCommands) {
		const commandObj: ApplicationCommand = collectionObj[1]
		const rolesList = commandObj.name === "set-problem-channel" ? setChannelRoles : setTimeRoles
		guild.commands.permissions.add({
			command: commandObj.id,
			permissions: rolesList.map(roleId => {
				return {
					id: roleId,
					type: "ROLE",
					permission: true
				}
			})
		})
	}

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

	runningJob = schedule.scheduleJob(rule, () => {
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

	//temp: testing
	// const soon = new Date(Date.now() + 2000)
	// runningJob = schedule.scheduleJob(soon, async () => {
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
	//
	// console.log("Scheduled testing job")
})

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return

	const { commandName, options } = interaction

	if (commandName === "ping") {
		await interaction.reply(`Pong (${interaction.client.ws.ping}ms)`)
	} else if (commandName === "set-problem-channel") {
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
			path.resolve(__dirname, "../../configs/channel-config.json"),
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
	} else if (commandName === "set-send-time") {
		const time: string = options
			.getString("time", true)
			.toLowerCase()
			.replace(/ /g, "")

		let newHour: number, newMinute: number, PM: boolean
		try {
			const semicolonIndex = time.indexOf(":")
			newHour = Number(time.substring(0, semicolonIndex))
			newMinute = Number(
				time.substring(semicolonIndex + 1, time.length - 2)
			)
			PM = time.substring(time.length - 2) === "pm"

			if (newHour < 1 || newHour > 12) {
				interaction.reply(
					"Unable to parse time: the hour must be between 1-12"
				)
				return
			}

			if (newMinute < 0 || newHour > 59) {
				interaction.reply(
					"Unable to parse time: the minute must be between 0-59"
				)
				return
			}

			if (
				!(
					time.substring(time.length - 2) === "am" ||
					time.substring(time.length - 2) === "pm"
				)
			) {
				interaction.reply(
					"Unable to parse time: Must specify either am or pm."
				)
				return
			}
		} catch (e) {
			interaction.reply(
				"Illegal time provided! Use the format HH:MM AM/PM."
			)
		}

		if (PM) newHour = newHour !== 12 ? newHour + 12 : newHour
		else newHour = newHour === 12 ? 0 : newHour

		triggerHour = newHour
		triggerMinute = newMinute

		fs.writeFileSync(
			path.resolve(__dirname, "../../configs/schedule-config.json"),
			JSON.stringify(
				{ hour: triggerHour, minute: triggerMinute },
				null,
				2
			)
		)

		const rule = new schedule.RecurrenceRule()
		rule.hour = newHour
		rule.minute = newMinute

		const success = runningJob.reschedule(rule, () => {
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

		if (success) {
			interaction.reply(
				"Successfully updated the problems to send at " +
					options.getString("time")
			)
			console.log(
				"Successfully updated the problems to send at " +
					options.getString("time")
			)
		} else {
			interaction.reply(
				"There was an issue scheduling the new process at " +
					options.getString("time")
			)
			console.log(
				"There was an issue scheduling the new process at " +
					options.getString("time")
			)
		}
	} else if (commandName === "get-send-time") {
		const formattedHour = triggerHour % 12 === 0 ? 12 : triggerHour % 12
		const formattedMinute = (triggerMinute < 10 ? "0" : "") + triggerMinute
		const tag = triggerHour >= 12 ? "PM" : "AM"
		interaction.reply(
			"Problems release daily at " +
				formattedHour +
				":" +
				formattedMinute +
				tag
		)

		console.log(
			"Date of next job invocation is: '" +
				runningJob.nextInvocation() +
				"'"
		)
	}
})

client.login(process.env.TOKEN)
