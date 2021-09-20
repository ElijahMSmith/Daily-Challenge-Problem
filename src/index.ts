import { Channel, ChannelManager, GuildChannel, TextChannel } from "discord.js"

const { Client, Intents } = require("discord.js")
const { token } = require("../../config.json")
const schedule = require("node-schedule")
const axios = require("axios").default
const client = new Client({ intents: [Intents.FLAGS.GUILDS] })

enum Difficulty {
	EASY = 1,
	MEDIUM = 2,
	HARD = 3,
}

interface Problem {
	name: string
	numAttempts: number
	numAccepts: number
	difficulty: Difficulty
	URL: string
	id: number
}

interface ProblemInfo {
	likes: number
	dislikes: number
	languages: []
}

const days = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
]

const months = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
]

// Randomly order the easy/medium/hard problems in these three arrays
const easyProblems: Problem[] = []
const mediumProblems: Problem[] = []
const hardProblems: Problem[] = []

// Move through each array, when we reach the end loop back to the beginning
let easyIndex = 0,
	mediumIndex = 0,
	hardIndex = 0

// 24 hour clock
const triggerHour: number = 9,
	triggerMinute: number = 0
const categoryName = "Daily Challenge Problems"
const easyChannel = "easy"
const mediumChannel = "medium"
const hardChannel = "hard"

const getChannels = (): TextChannel[] => {
	// Go through once and look for channel with name 'Daily Challenge Problems' and type 'GUILD_CATEGORY'
	// Get the .id of that category
	// Go back through and look for all channels 'easy', 'medium', and 'hard' with
	// .parentId = .id of the category channel

	const cm = client.channels.cache
	const categoryChannel: GuildChannel = cm.find(
		(channel: GuildChannel) =>
			channel.name === categoryName && channel.type === "GUILD_CATEGORY"
	)
	const categoryID = categoryChannel.id

	const easy: TextChannel = cm.find(
		(channel: GuildChannel) =>
			channel.name === easyChannel &&
			channel.parentId === categoryID &&
			channel.type === "GUILD_TEXT"
	)
	const medium: TextChannel = cm.find(
		(channel: GuildChannel) =>
			channel.name === mediumChannel &&
			channel.parentId === categoryID &&
			channel.type === "GUILD_TEXT"
	)

	const hard: TextChannel = cm.find(
		(channel: GuildChannel) =>
			channel.name === hardChannel &&
			channel.parentId === categoryID &&
			channel.type === "GUILD_TEXT"
	)

	return [easy, medium, hard]
}

const runProcess = function (): void {
	const postChannels: TextChannel[] = getChannels()

	const currentProblems: Problem[] = generateProblems()

	console.log("-------------------------------------")
	console.log("Selected Problem Data: ")
	console.log(currentProblems)
	console.log("-------------------------------------")

	sendProblems(postChannels, currentProblems)
}

const generateProblems = (): Problem[] => {
	// Checking against storage for what problems we've used recently
	// Generate an easy, medium, and hard problem that haven't been used in the last cycle
	// Mark those problems as being used in the storage feature

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

const sendProblems = (
	postChannels: TextChannel[],
	problemData: Problem[]
): void => {
	// Index 0 is easy problem, index 1 is medium problem, index 2 is hard problem

	for (let i = 1; i <= 3; i++) {
		const sendChannel = postChannels[i - 1]
		const sendProblem = problemData[i - 1]

		if (!sendChannel) {
			console.log(
				`Couldn't find the ${
					i === Difficulty.EASY
						? easyChannel
						: i === Difficulty.MEDIUM
						? mediumChannel
						: hardChannel
				} text channel in the category "${categoryName}"!`
			)
		} else {
			sendChannel.send(getMessage(sendProblem))
		}
	}
}

const getMessage = (problem: Problem): string => {
	const today = new Date()

	return (
		"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
		"__**\nDaily Challenge for " +
		days[today.getDay()] +
		" " +
		months[today.getMonth()] +
		" " +
		today.getDate() +
		", " +
		today.getFullYear() +
		"\n\n**__" +
		"Problem number " +
		problem.id +
		": " +
		problem.name +
		"\n" +
		"Number of Submissions: " +
		problem.numAttempts +
		"\n" +
		"Number Accepted: " +
		problem.numAccepts +
		" (" +
		((problem.numAccepts / problem.numAttempts) * 100).toFixed(2) +
		"%)\n" +
		"Difficulty: " +
		(problem.difficulty === Difficulty.EASY
			? "Easy"
			: problem.difficulty === Difficulty.MEDIUM
			? "Medium"
			: problem.difficulty === Difficulty.HARD
			? "Hard"
			: "Unknown") +
		"\n\n" +
		problem.URL
	)
}

function shuffle(array: object[]) {
	let currentIndex: number = array.length,
		randomIndex: number

	// While there remain elements to shuffle...
	while (currentIndex != 0) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex)
		currentIndex--

		// And swap it with the current element.
		;[array[currentIndex], array[randomIndex]] = [
			array[randomIndex],
			array[currentIndex],
		]
	}

	return array
}

const getAllProblems = async (): Promise<void> => {
	const response = await axios({
		method: "get",
		url: "https://leetcode.com/api/problems/algorithms/",
	})

	let problems = response.data.stat_status_pairs
	for (let prob of problems) {
		// If we can't get a problem for everyone, throw it away
		if (prob.stat.question_hide || prob.paid_only) continue

		const pushTo =
			prob.difficulty.level === 1
				? easyProblems
				: prob.difficulty.level === 2
				? mediumProblems
				: hardProblems

		const newProbObj = {
			name: prob.stat.question__title
				? prob.stat.question__title
				: "Name Unavailable",
			numAttempts: prob.stat.total_submitted
				? prob.stat.total_submitted
				: 0,
			numAccepts: prob.stat.total_acs ? prob.stat.total_acs : 0,
			difficulty: prob.difficulty.level ? prob.difficulty.level : 0,
			URL: `https://leetcode.com/problems/${prob.stat.question__title_slug}/`,
			id: prob.stat.question_id ? prob.stat.question_id : 0,
		}

		pushTo.push(newProbObj)
	}

	shuffle(easyProblems)
	shuffle(mediumProblems)
	shuffle(hardProblems)

	/*
	response.data: Return object structure and useful fields
	{
		num_total: number,
		stat_status_pairs: [
			{
				stat: {
					question_id: number 1-...,
					question_hide: true/false,
					question__title: "Something Something"
					question_title_slug: "something-something", // https://leetcode.com/problems/question_title_slug/
					total_submitted: number,
					total_acs: number,

				},
				difficulty: {
					level: 1-3
				},
				paid_only: true/false,
				...
			},
			...
		]
	}
	*/
}

const getAdditionalProblemInfo = () /*: ProblemInfo*/ => {
	//TODO: Get more information about the problem: description, likes, dislikes, etc?
	//Will need to query the graphql that the site does when you load the problem page
	return {}
}

client.once("ready", async () => {
	console.log("Daily Challenge Problem bot online.")

	console.log("Attempting to get problem set...")
	await getAllProblems()

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
	const endTime = new Date(startTime.getTime() + 10000)
	const job = schedule.scheduleJob(
		{ start: startTime, end: endTime, rule: "*/2 * * * * *" },
		runProcess
	)
})

client.login(token)
