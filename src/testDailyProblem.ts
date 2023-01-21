import { Client, GatewayIntentBits } from "discord.js"
import { getDailyProblem } from "./fetchDailyProblem"
import dotenv from "dotenv"

dotenv.config()

const client = new Client({
	intents: [GatewayIntentBits.Guilds],
})

client.once("ready", async () => {
	await getDailyProblem()
	console.log("Finished")
})

client.login(process.env.TOKEN)
