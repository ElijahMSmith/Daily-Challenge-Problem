import { SlashCommandBuilder } from "@discordjs/builders"
import { Routes } from "discord-api-types/v9"
import { REST } from "@discordjs/rest"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.resolve(__dirname, "../../.env") })

const commands = [
	new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Test bot latency in ms"),
	new SlashCommandBuilder()
		.setName("set-problem-channel")
		.setDescription("Direct the challenge problem bot to specific channels")
		.addStringOption((option) =>
			option
				.setName("difficulty")
				.setDescription(
					"Which problem difficulty to send to this channel"
				)
				.addChoices([
					["easy", "easy"],
					["medium", "medium"],
					["hard", "hard"],
				])
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("channel-group")
				.setDescription(
					"The name of the channel group the desired channel is in"
				)
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("channel-name")
				.setDescription("The name of the channel to use")
				.setRequired(true)
		)
		.setDefaultPermission(false),
	new SlashCommandBuilder()
		.setName("get-problem-channel")
		.setDescription(
			"Identifies which channel the problems of a given difficulty are going to"
		)
		.addStringOption((option) =>
			option
				.setName("difficulty")
				.setDescription("Which difficulty problem stream to check")
				.addChoices([
					["easy", "easy"],
					["medium", "medium"],
					["hard", "hard"],
				])
				.setRequired(true)
		),
	new SlashCommandBuilder()
		.setName("set-send-time")
		.setDescription("Set which time the daily problems send out")
		.addStringOption((option) =>
			option
				.setName("time")
				.setDescription(
					"When to send out new daily problems. Format: HH:MM AM/PM"
				)
				.setRequired(true)
		)
		.setDefaultPermission(false),
	new SlashCommandBuilder()
		.setName("get-send-time")
		.setDescription(
			"Find out what time the daily challenge problems are set to release"
		),
].map((command) => command.toJSON())

const rest = new REST({ version: "9" }).setToken(process.env.TOKEN)

const reloadCommands = async () => {
	try {
		await rest.put(
			Routes.applicationGuildCommands(
				process.env.CLIENT_ID,
				process.env.GUILD_ID
			),
			{
				body: commands,
			}
		)

		console.log("Successfully registered application commands.")
	} catch (error) {
		console.error(error)
	}
}

reloadCommands()
