import {
	ThreadChannel,
	GuildChannel,
	TextChannel,
	Message,
	Client,
} from "discord.js"
import { getDifficultyString, months, days } from "./utils/utils"
import { OutputChannel, Problem } from "./utils/types"

// --------- Execution Functions ---------

export const runProcess = async function (
	client: Client,
	currentProblems: Problem[],
	channelData: Record<string, OutputChannel>
): Promise<void> {
	console.log("-------------------------------------")
	console.log("Selected Problem Data: ")
	console.log(currentProblems)
	console.log("-------------------------------------")

	if (!currentProblems[0] || !currentProblems[1] || !currentProblems[2]) {
		console.log(
			"Could not load one or more problem difficulties, not sending as a result"
		)
		return
	}

	const postChannels: TextChannel[] = getChannels(client, channelData)
	sendProblems(postChannels, currentProblems, channelData)
}

export const getChannels = (
	client: Client,
	channelData: Record<string, OutputChannel>
): TextChannel[] => {
	// Go through once and look for channel with name 'Daily Challenge Problems' and type 'GUILD_CATEGORY'
	// Get the .id of that category
	// Go back through and look for all channels 'easy', 'medium', and 'hard' with
	// .parentId = .id of the category channel

	const cm = client.channels.cache
	const allChannelData = [
		channelData.easy,
		channelData.medium,
		channelData.hard,
	]
	const returnChannels = []

	for (let i = 0; i < 3; i++) {
		const channelData = allChannelData[i]

		console.log("Looking for channel with matching data: ", channelData)

		const parentCategory: GuildChannel = <GuildChannel>(
			cm.find(
				(channel: GuildChannel) =>
					channel.name.toLowerCase() ===
						channelData.channelGroup.toLowerCase() &&
					channel.type === "GUILD_CATEGORY"
			)
		)

		if (!parentCategory) {
			returnChannels.push(undefined)
			continue
		}

		const channelObject: TextChannel = <TextChannel>(
			cm.find(
				(channel: GuildChannel) =>
					channel.name.toLowerCase() ===
						channelData.channelName.toLowerCase() &&
					channel.parentId === parentCategory.id &&
					channel.type === "GUILD_TEXT"
			)
		)

		returnChannels.push(channelObject)
	}

	return returnChannels
}

export const sendProblems = async (
	postChannels: TextChannel[],
	problemData: Problem[],
	channelDataObject: Record<string, OutputChannel>
): Promise<void> => {
	// Index 0 is easy problem, index 1 is medium problem, index 2 is hard problem

	for (let i = 0; i < 3; i++) {
		const sendChannel = postChannels[i]
		const sendProblem = problemData[i]

		const allChannelData = [
			channelDataObject.easy,
			channelDataObject.medium,
			channelDataObject.hard,
		]

		if (!sendChannel) {
			console.log(
				`Couldn't find the ${getDifficultyString(
					sendProblem.difficulty
				)} text channel '${
					allChannelData[i].channelName
				}' in the category "${allChannelData[i].channelGroup}"!`
			)
		} else {
			const today = new Date()
			const stringDate = months[today.getMonth()] + " " + today.getDate()

			const message: Message = await sendChannel.send(
				getMessage(sendProblem)
			)

			const thread: ThreadChannel = await message.startThread({
				name: "Discussion (" + stringDate + ") - " + sendProblem.name,
				autoArchiveDuration: 1440, // One day
			})

			thread.send(
				"This thread will archive after 24h of inactivity.\n\n**Discuss!**"
			)
		}
	}
}

const getMessage = (problem: Problem): string => {
	const today = new Date()
	const difficultyString = getDifficultyString(problem.difficulty)

	return (
		"━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
		"__**\nDaily Challenge for " +
		days[today.getDay()] +
		" " +
		months[today.getMonth()] +
		" " +
		today.getDate() +
		", " +
		today.getFullYear() +
		"\n\n**__" +
		"Problem Number " +
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
		difficultyString +
		"\n\n" +
		problem.URL
	)
}