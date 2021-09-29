export enum Difficulty {
	EASY = 1,
	MEDIUM = 2,
	HARD = 3,
}

export interface Problem {
	name: string
	slug: string
	numAttempts: number
	numAccepts: number
	difficulty: Difficulty
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

export interface ProblemInfo {
	likes: number
	dislikes: number
	htmlContent: string
	similarQuestions: SimilarProblemInfo[]
	topics: Topic[]
}

export interface OutputChannel {
	channelGroup: string
	channelName: string
}
