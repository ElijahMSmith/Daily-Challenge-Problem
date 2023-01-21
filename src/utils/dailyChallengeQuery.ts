export default `
query {
    activeDailyCodingChallengeQuestion {
        question {
            questionId
            boundTopicId
            title
            titleSlug
            content
            translatedTitle
            translatedContent
            difficulty
            likes
            dislikes
            isLiked
            similarQuestions
            topicTags {
                name
                slug
                translatedName
            }
            companyTagStats
            stats
            hints
            status
            note
        }
    }
}
`
