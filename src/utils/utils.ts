import { Difficulty } from "./types"

export const days = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
]

export const months = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
]

export const getDifficultyString = (diff: number): string => {
	return diff === Difficulty.EASY
		? "Easy"
		: diff === Difficulty.MEDIUM
		? "Medium"
		: "Hard"
}
