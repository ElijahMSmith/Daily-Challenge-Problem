import {
	ThreadChannel,
	TextChannel,
	Message,
	Client,
	Guild,
	ChannelType,
	ForumChannel,
	EmbedBuilder,
} from "discord.js"
import { days, months } from "./utils/utils"
import { Problem, SimilarProblemInfo, Topic } from "./utils/types"
import { channel } from "diagnostics_channel"

// --------- Execution Functions ---------

export const runProcess = async function (
	client: Client,
	prob: Problem
): Promise<void> {
	for (let guildRecord of client.guilds.cache)
		await sendProblem(prob, guildRecord[1])
}

export const sendProblem = async (
	prob: Problem,
	guild: Guild
): Promise<void> => {
	const keywords = [
		"leetcode",
		"daily-challenge",
		"daily_challenge",
		"dailychallenge",
	]

	const allChannels = await guild.channels.fetch()

	const sendChannel = allChannels.find((channel) => {
		for (let keyword of keywords)
			if (channel.name.includes(keyword)) return true
		return false
	})

	if (!sendChannel) {
		console.log(
			"Could not find a channel in which to post for guild " + guild.name
		)
		return
	}

	// LeetCode opens the problem assigned to the next day for 24hrs, which is what we have
	const tomorrow = new Date(new Date().getTime() + 1000 * 60 * 60 * 24)
	const stringDate = months[tomorrow.getMonth()] + " " + tomorrow.getDate()

	// TypeGuard to determine channel type
	if (
		((sendChannel): sendChannel is TextChannel =>
			sendChannel.type === ChannelType.GuildText)(sendChannel)
	) {
		console.log(
			"Found TextChannel " +
				channel.name +
				" in which to post for guild " +
				guild.name
		)

		try {
			const message: Message = await sendChannel.send({
				embeds: [getProblemEmbed(prob, tomorrow)],
			})

			console.log("Starting thread on problem sent in TextChannel")
			const thread: ThreadChannel = await message.startThread({
				name: "Discussion (" + stringDate + ") - " + prob.name,
				autoArchiveDuration: 1440, // One day
			})

			await thread.send(
				"This thread will archive after 24h of inactivity.\n\nPlease wrap any code in a spoiler (with |\\|code|\\|) or a file upload so that others can solve this on their own.\n\n**Good luck!**"
			)

			console.log("Successfully posted!")
		} catch (error) {
			console.error(
				"Error occurred while posting to ForumChannel:",
				error
			)
		}
	} else if (
		((sendChannel): sendChannel is ForumChannel =>
			sendChannel.type === ChannelType.GuildForum)(sendChannel)
	) {
		console.log(
			"Found ForumChannel " +
				channel.name +
				" in which to post for guild " +
				guild.name
		)

		try {
			await sendChannel.threads.create({
				name: `Daily LeetCode Challenge (${stringDate})`,
				message: {
					embeds: [getProblemEmbed(prob, tomorrow)],
				},
			})

			console.log("Successfully posted!")
		} catch (error) {
			console.error(
				"Error occurred while posting to ForumChannel:",
				error
			)
		}
	} else {
		console.log(
			"Could not post to channel " +
				sendChannel.name +
				" in guild " +
				guild.name +
				" which is not a TextChannel or ForumChannel."
		)
	}
}

const getProblemEmbed = (problem: Problem, date: Date): EmbedBuilder => {
	return new EmbedBuilder()
		.setTitle(
			`Daily Challenge for ${days[date.getDay()]}, ${
				months[date.getMonth()]
			} ${date.getDate()}, ${date.getFullYear()}`
		)
		.setURL(problem.URL)
		.addFields(
			{ name: "Problem", value: "(" + problem.id + ") " + problem.name },
			{ name: "URL", value: problem.URL },
			{
				name: "Submissions",
				value: problem.numAttempts.toString(),
				inline: true,
			},
			{
				name: "Accepted",
				value: problem.numAccepts.toString(),
				inline: true,
			},
			{
				name: "Accepted %",
				value:
					((problem.numAccepts / problem.numAttempts) * 100).toFixed(
						2
					) + "%",
				inline: true,
			},
			{ name: "Difficulty", value: problem.difficulty, inline: true },
			{
				name: "Likes",
				value: problem.likes.toString(),
				inline: true,
			},
			{
				name: "Dislike",
				value: problem.dislikes.toString(),
				inline: true,
			},
			{
				name: "Tagged Topics",
				value: generateTagsString(problem.tagged),
			},
			{
				name: "Similar Problems",
				value: generateSimilarString(problem.similar),
			}
		)
}

const generateTagsString = (tagged: Topic[]): string => {
	if (tagged.length === 0) return "None"
	return tagged.reduce((accumulated, topic) => {
		return accumulated + topic.name + " - " + topic.url + "\n"
	}, "")
}

const generateSimilarString = (similar: SimilarProblemInfo[]): string => {
	if (similar.length === 0) return "None"
	return similar.reduce((accumulated, question) => {
		return accumulated + question.difficulty + " - " + question.url + "\n"
	}, "")
}
