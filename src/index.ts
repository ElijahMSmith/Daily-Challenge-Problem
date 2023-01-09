import { runProcess } from "./problemFunctions"
import { getAllProblems } from "./requests"
import { Problem } from "./utils/types"
import { Client, GatewayIntentBits } from "discord.js"
import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

const client = new Client({
	intents: [GatewayIntentBits.Guilds],
})

// --------- Problem Storage ---------

let easyProblems: Problem[], mediumProblems: Problem[], hardProblems: Problem[]

let easyIndex = 0,
	mediumIndex = 0,
	hardIndex = 0

// --------- Main execution ---------

const generateNextProblems = (): Problem[] => {
	const newProblems: Problem[] = [
		easyProblems[easyIndex],
		mediumProblems[mediumIndex],
		hardProblems[hardIndex],
	]

	console.log(
		`Got the ${easyIndex + 1}/${easyProblems.length} easy problem, ${
			mediumIndex + 1
		}/${mediumProblems.length} medium problem, and the ${hardIndex + 1}/${
			hardProblems.length
		} hard problem`
	)

	easyIndex = (easyIndex + 1) % easyProblems.length
	mediumIndex = (mediumIndex + 1) % mediumProblems.length
	hardIndex = (hardIndex + 1) % hardProblems.length

	return newProblems
}

client.once("ready", async () => {
	console.log("Bot online! Picking and sending today's problems...")

	console.log("Attempting to get problem set...")
	const allProblems: Problem[][] = await getAllProblems(axios)

	easyProblems = allProblems[0]
	mediumProblems = allProblems[1]
	hardProblems = allProblems[2]

	console.log(
		`Retrieved ${easyProblems.length} easy problems, ${mediumProblems.length} medium problems, and ${hardProblems.length} hard problems`
	)

	generateNextProblems()
	await runProcess(client, [
		easyProblems[easyIndex],
		mediumProblems[mediumIndex],
		hardProblems[hardIndex],
	])

	console.log("Finished sending problems, powering down.")
	client.destroy()
	//process.exit()
})

console.log(process.env.TOKEN)

client.login(process.env.TOKEN)
