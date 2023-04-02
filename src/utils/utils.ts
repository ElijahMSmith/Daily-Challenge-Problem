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

export function probSlugToURL(slug: string) {
	return "https://leetcode.com/problems/" + slug
}

export function tagSlugToURL(slug: string) {
	return "https://leetcode.com/tag/" + slug
}
