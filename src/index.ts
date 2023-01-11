import { runProcess } from "./problemFunctions"
import { getAllProblems } from "./requests"
import { Problem } from "./utils/types"
import { Client, GatewayIntentBits } from "discord.js"
import axios from "axios"
import dotenv from "dotenv"
import * as functions from "@google-cloud/functions-framework"

functions.http("sendTodaysProblems", (req, res) => {
	dotenv.config()

	const client = new Client({
		intents: [GatewayIntentBits.Guilds],
	})

	const pickTodaysProblems = (problemData: Problem[][]): Problem[] => {
		problemData.forEach((difficultySet) => {
			difficultySet.sort((probA, probB) => {
				return probA.id - probB.id
			})
		})

		const [easyProblems, mediumProblems, hardProblems] = problemData
		const index = Math.floor(
			(new Date().getTime() - new Date(0).getTime()) / 1000 / 60 / 60 / 24
		)

		const easyIndex = index % easyProblems.length,
			mediumIndex = index % mediumProblems.length,
			hardIndex = index % hardProblems.length

		console.log(
			`Got the ${easyIndex + 1}/${easyProblems.length} easy problem, ${
				mediumIndex + 1
			}/${mediumProblems.length} medium problem, and the ${
				hardIndex + 1
			}/${hardProblems.length} hard problem`
		)

		return [
			easyProblems[easyIndex],
			mediumProblems[mediumIndex],
			hardProblems[hardIndex],
		]
	}

	client.once("ready", async () => {
		console.log("Bot online! Picking and sending today's problems...")

		console.log("Attempting to get problem set...")
		const allProblems: Problem[][] = await getAllProblems(axios)

		console.log(
			`Retrieved ${allProblems[0].length} easy problems, ${allProblems[1].length} medium problems, and ${allProblems[2].length} hard problems`
		)

		await runProcess(client, pickTodaysProblems(allProblems))

		console.log("Finished sending problems, powering down.")
		client.destroy()
		res.send("Finished")
	})

	client.login(process.env.TOKEN)
})
