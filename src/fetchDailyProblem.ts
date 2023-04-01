import { LeetCode } from "leetcode-query"
import { Problem } from "./utils/types"

async function getDailyProblem(): Promise<Problem> {
	const client = new LeetCode()
	const res = await client.daily()
	const parsedStats = JSON.parse(res.question.stats)

	return {
		name: res.question.title,
		slug: res.question.titleSlug,
		numAttempts: parsedStats.totalSubmissionRaw,
		numAccepts: parsedStats.totalAcceptedRaw,
		difficulty: res.question.difficulty,
		likes: res.question.likes,
		dislikes: res.question.dislikes,
		tagged: res.question.topicTags,
		similar: res.question.similarQuestions,
		URL: "https://leetcode.com" + res.link,
		id: Number(res.question.questionFrontendId),
	}
}

export { getDailyProblem }
