import { ProblemDifficulty } from "leetcode-query"

export type Difficulty = "Easy" | "Medium" | "Hard"

export interface Problem {
	name: string
	slug: string
	numAttempts: number
	numAccepts: number
	difficulty: ProblemDifficulty
	likes: number
	dislikes: number
	tagged: Topic[]
	similar: SimilarProblemInfo[]
	URL: string
	id: number
}

export interface Topic {
	name: string
	slug: string
	url: string
}

export interface SimilarProblemInfo {
	name: string
	slug: string
	difficulty: string
	url: string
}
