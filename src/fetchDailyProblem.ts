import { LeetCode } from "leetcode-query"

async function getDailyProblem() {
	const client = new LeetCode()
	console.log(await client.daily())
}

export { getDailyProblem }
