import {
	ThreadChannel,
	TextChannel,
	Message,
	Client,
	Guild,
	ChannelType,
} from "discord.js"
import { getDifficultyString, months, days } from "./utils/utils"
import { Problem, ProblemInfo } from "./utils/types"
import { getAdditionalProblemInfo } from "./requests"
import { EmbedBuilder } from "@discordjs/builders"

// --------- Execution Functions ---------

export const runProcess = async function (
	client: Client,
	currentProblems: Problem[]
): Promise<void> {
	console.log("Token: " + client.token)

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

	for (let guildRecord of client.guilds.cache)
		await sendProblems(currentProblems, guildRecord[1])
}

export const sendProblems = async (
	problemData: Problem[],
	guild: Guild
): Promise<void> => {
	// Index 0 is easy problem, index 1 is medium problem, index 2 is hard problem
	for (let i = 0; i < 3; i++) {
		const sendProblem = problemData[i]

		const allChannels = await guild.channels.fetch()
		const sendChannel = allChannels.find((channel) =>
			channel.name.includes(process.env.CHANNEL_NAME)
		)

		if (!sendChannel) {
			console.log(
				`Couldn't find the required text channel in guild with id ${guild.id}!`
			)
			return
		}

		// Using a type guard to narrow down the correct type of TextChannel
		if (
			!((sendChannel): sendChannel is TextChannel =>
				sendChannel.type === ChannelType.GuildText)(sendChannel)
		) {
			console.log(
				`Found the required channel in guild with id ${guild.id} but it's not a text channel!`
			)
			return
		}

		const today = new Date()
		const stringDate = months[today.getMonth()] + " " + today.getDate()

		console.log("Sending out to guild " + guild.id)
		const message: Message = await sendChannel.send({
			embeds: [await getProblemEmbed(sendProblem)],
		})

		console.log("Starting thread on sent problem")
		const thread: ThreadChannel = await message.startThread({
			name: "Discussion (" + stringDate + ") - " + sendProblem.name,
			autoArchiveDuration: 1440, // One day
		})

		await thread.send(
			"This thread will archive after 24h of inactivity.\n\n**Discuss!**"
		)
	}
}

const getProblemEmbed = async (problem: Problem): Promise<EmbedBuilder> => {
	const today = new Date()
	const difficultyString = getDifficultyString(problem.difficulty)
	const additionalProblemInfo = await getAdditionalProblemInfo(problem)
	return new EmbedBuilder()
		.setTitle(
			`Daily Challenge for ${days[today.getDay()]} ${
				months[today.getMonth()]
			} ${today.getDate()} ${today.getFullYear()}`
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
			{ name: "Difficulty", value: difficultyString, inline: true },
			{
				name: "Likes",
				value: additionalProblemInfo.likes.toString(),
				inline: true,
			},
			{
				name: "Dislike",
				value: additionalProblemInfo.dislikes.toString(),
				inline: true,
			},
			{
				name: "Tagged Topics",
				value: generateTagsString(additionalProblemInfo),
			},
			{
				name: "Similar Problems",
				value: generateSimilarString(additionalProblemInfo),
			}
		)
}

const generateSimilarString = (info: ProblemInfo): string => {
	const build = info.similarQuestions.reduce((accumulated, question) => {
		if (!question)
			throw new Error(
				"Trying to generate string of similar problems from an undefined ProblemInfo object. Full similarQuestions array."
			)
		return accumulated + question.difficulty + " - " + question.url + "\n"
	}, "")
	return build === "" ? "None" : build
}

const generateTagsString = (info: ProblemInfo): string => {
	const build = info.topics.reduce((accumulated, topic) => {
		if (!topic)
			throw new Error(
				"Trying to generate string of topics from an undefined ProblemInfo object."
			)

		return accumulated + topic.name + " - " + topic.url + "\n"
	}, "")
	return build === "" ? "None" : build
}
