import { runProcess } from "./problemFunctions"
import { Client, GatewayIntentBits } from "discord.js"
import dotenv from "dotenv"
import * as functions from "@google-cloud/functions-framework"
import { getDailyProblem } from "./fetchDailyProblem"

functions.http("sendTodaysProblems", (_, res) => {
	dotenv.config()

	const client = new Client({
		intents: [GatewayIntentBits.Guilds],
	})

	client.once("ready", async () => {
		console.log("Bot online! Attempting to send daily problem...")

		const problem = await getDailyProblem()
		runProcess(client, problem)
			.then(() => {
				res.status(200).send()
			})
			.catch((err) => {
				res.status(400).send(err)
			})
			.finally(() => {
				console.log("Finished and powering off.")
				client.destroy()
			})
	})

	client.login(process.env.TOKEN)
})

if (process.env.NODE_ENV === "dev") {
	dotenv.config()

	const client = new Client({
		intents: [GatewayIntentBits.Guilds],
	})

	client.once("ready", async () => {
		console.log("Testing bot online! Attempting to send daily problem...")

		getDailyProblem()
			.then((prob) =>
				runProcess(client, prob)
					.then(() => {
						console.log("Finished and powering off.")
						client.destroy()
					})
					.catch((err) => console.error(err))
			)
			.catch((err) => console.error(err))
	})

	client.login(process.env.TOKEN)
}
