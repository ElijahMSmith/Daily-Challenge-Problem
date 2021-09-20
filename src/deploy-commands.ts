import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"
import fs from "fs"
import dotenv from "dotenv"

dotenv.config()

const commands = []
const commandFiles = fs
	.readdirSync("./commands")
	.filter((file) => file.endsWith(".js"))

// Place your client and guild ids here
const clientId = "887492809806974976"
const guildId = "889280418094927872"

for (const file of commandFiles) {
	const command = require(`./commands/${file}`)
	commands.push(command.data.toJSON())
}

const rest = new REST({ version: "9" }).setToken(process.env.TOKEN)

;(async () => {
	try {
		console.log("Started refreshing application (/) commands.")

		await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
			body: commands,
		})

		console.log("Successfully reloaded application (/) commands.")
	} catch (error) {
		console.error(error)
	}
})()
