import {
	ThreadChannel,
	GuildChannel,
	TextChannel,
	Message,
	Client,
} from "discord.js"
import { getDifficultyString, months, days } from "./utils/utils"
import { Problem } from "./utils/types"

const categoryName = "Daily Challenge Problems"
const easyChannel = "easy"
const mediumChannel = "medium"
const hardChannel = "hard"

export const getChannels = (client: Client): TextChannel[] => {
	// Go through once and look for channel with name 'Daily Challenge Problems' and type 'GUILD_CATEGORY'
	// Get the .id of that category
	// Go back through and look for all channels 'easy', 'medium', and 'hard' with
	// .parentId = .id of the category channel

	const cm = client.channels.cache

	const categoryChannel: GuildChannel = <GuildChannel>(
		cm.find(
			(channel: GuildChannel) =>
				channel.name === categoryName &&
				channel.type === "GUILD_CATEGORY"
		)
	)

	const categoryID = categoryChannel.id

	const easy: TextChannel = <TextChannel>(
		cm.find(
			(channel: GuildChannel) =>
				channel.name === easyChannel &&
				channel.parentId === categoryID &&
				channel.type === "GUILD_TEXT"
		)
	)
	const medium: TextChannel = <TextChannel>(
		cm.find(
			(channel: GuildChannel) =>
				channel.name === mediumChannel &&
				channel.parentId === categoryID &&
				channel.type === "GUILD_TEXT"
		)
	)

	const hard: TextChannel = <TextChannel>(
		cm.find(
			(channel: GuildChannel) =>
				channel.name === hardChannel &&
				channel.parentId === categoryID &&
				channel.type === "GUILD_TEXT"
		)
	)

	return [easy, medium, hard]
}

export const sendProblems = async (
	postChannels: TextChannel[],
	problemData: Problem[]
): Promise<void> => {
	// Index 0 is easy problem, index 1 is medium problem, index 2 is hard problem

	for (let i = 0; i <= 2; i++) {
		const sendChannel = postChannels[i]
		const sendProblem = problemData[i]

		if (!sendChannel) {
			console.log(
				`Couldn't find the ${getDifficultyString(
					sendProblem.difficulty
				)} text channel in the category "${categoryName}"!`
			)
		} else {
			const today = new Date()
			const stringDate = months[today.getMonth()] + " " + today.getDate()
			const difficultyString = getDifficultyString(sendProblem.difficulty)

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
