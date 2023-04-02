import { LeetCode, ProblemDifficulty } from "leetcode-query"
import { Problem, SimilarProblemInfo, Topic } from "./utils/types"
import { probSlugToURL, tagSlugToURL } from "./utils/utils"

type SimilarRaw = {
	title: string
	titleSlug: string
	difficulty: ProblemDifficulty
	translatedTitle: string | null
}

async function getDailyProblem(): Promise<Problem> {
	const client = new LeetCode()
	const res = await client.daily()
	const parsedStats = JSON.parse(res.question.stats)

	const similarProblems: SimilarProblemInfo[] = JSON.parse(
		res.question.similarQuestions
	).map((prob: SimilarRaw) => {
		return {
			name: prob.title,
			slug: prob.titleSlug,
			difficulty: prob.difficulty,
			url: probSlugToURL(prob.titleSlug),
		}
	})

	return {
		name: res.question.title,
		slug: res.question.titleSlug,
		numAttempts: <number>parsedStats.totalSubmissionRaw,
		numAccepts: <number>parsedStats.totalAcceptedRaw,
		difficulty: res.question.difficulty,
		likes: res.question.likes,
		dislikes: res.question.dislikes,
		tagged: res.question.topicTags.map<Topic>((tag) => {
			return {
				name: tag.name,
				slug: tag.slug,
				url: tagSlugToURL(tag.slug),
			}
		}),
		similar: similarProblems,
		URL: "https://leetcode.com" + res.link,
		id: Number(res.question.questionFrontendId),
	}
}

export { getDailyProblem }
