export enum Difficulty {
	EASY = 1,
	MEDIUM = 2,
	HARD = 3,
}

export interface Problem {
	name: string
	numAttempts: number
	numAccepts: number
	difficulty: Difficulty
	URL: string
	id: number
}

export interface ProblemInfo {
	likes: number
	dislikes: number
	languages: []
}

export interface OutputChannel {
	channelGroup: string
	channelName: string
}
