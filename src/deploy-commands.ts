import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"
import fs from "fs"
import dotenv from "dotenv"

dotenv.config()

const commands = []
const commandFiles = fs
	.readdirSync("./commands")
	.filter((file) => file.endsWith(".js"))

const clientId = "887492809806974976"
const guildId = "889280418094927872"

/*

I think this goes in the individual commands files
Role to use for testing: 889619022583320666 - "RolesTest"
const permissions = [
	{
		id: "224617799434108928",
		type: "USER",
		permission: true,
	},
]

await command.permissions.set({ permissions })

*/

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
