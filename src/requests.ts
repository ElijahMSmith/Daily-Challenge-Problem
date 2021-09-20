import { Problem } from "./utils/types"

const shuffle = (array: object[]) => {
	let currentIndex: number = array.length,
		randomIndex: number

	// While there remain elements to shuffle
	while (currentIndex != 0) {
		// Pick a remaining element
		randomIndex = Math.floor(Math.random() * currentIndex)
		currentIndex--

		const temp = array[currentIndex]
		array[currentIndex] = array[randomIndex]
		array[randomIndex] = temp
	}

	return array
}

export const getAllProblems = async (
	axios,
	lists: Problem[][]
): Promise<void> => {
	const response = await axios({
		method: "get",
		url: "https://leetcode.com/api/problems/algorithms/",
	})

	let problems = response.data.stat_status_pairs
	let easyProblems: Problem[] = lists[0],
		mediumProblems: Problem[] = lists[1],
		hardProblems: Problem[] = lists[2]

	for (let prob of problems) {
		// If we can't get a problem for everyone, throw it away
		if (prob.stat.question_hide || prob.paid_only) continue

		const pushTo =
			prob.difficulty.level === 1
				? easyProblems
				: prob.difficulty.level === 2
				? mediumProblems
				: hardProblems

		const newProbObj = {
			name: prob.stat.question__title
				? prob.stat.question__title
				: "Name Unavailable",
			numAttempts: prob.stat.total_submitted
				? prob.stat.total_submitted
				: 0,
			numAccepts: prob.stat.total_acs ? prob.stat.total_acs : 0,
			difficulty: prob.difficulty.level ? prob.difficulty.level : 0,
			URL: `https://leetcode.com/problems/${prob.stat.question__title_slug}/`,
			id: prob.stat.question_id ? prob.stat.question_id : 0,
		}

		pushTo.push(newProbObj)
	}

	shuffle(easyProblems)
	shuffle(mediumProblems)
	shuffle(hardProblems)

	/*
	response.data: Return object structure and useful fields
	{
		num_total: number,
		stat_status_pairs: [
			{
				stat: {
					question_id: number 1-...,
					question_hide: true/false,
					question__title: "Something Something"
					question_title_slug: "something-something", // https://leetcode.com/problems/question_title_slug/
					total_submitted: number,
					total_acs: number,

				},
				difficulty: {
					level: 1-3
				},
				paid_only: true/false,
				...
			},
			...
		]
	}
	*/
}

const getAdditionalProblemInfo = () /*: ProblemInfo*/ => {
	//TODO: Get more information about the problem: description, likes, dislikes, etc?
	//Will need to query the graphql that the site does when you load the problem page
	return {}
}
