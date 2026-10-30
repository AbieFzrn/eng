export const defaultSentences = [
  {
    text: "The cat is sleeping on the sofa",
    words: [
      { text: "The", class: "article" },
      { text: "cat", class: "noun" },
      { text: "is", class: "verb" },
      { text: "sleeping", class: "verb" },
      { text: "on", class: "preposition" },
      { text: "the", class: "article" },
      { text: "sofa", class: "noun" }
    ],
    distractors: ["sleeps", "in", "dog"]
  },
  {
    text: "She always drinks coffee in the morning",
    words: [
      { text: "She", class: "pronoun" },
      { text: "always", class: "adverb" },
      { text: "drinks", class: "verb" },
      { text: "coffee", class: "noun" },
      { text: "in", class: "preposition" },
      { text: "the", class: "article" },
      { text: "morning", class: "noun" }
    ],
    distractors: ["drink", "tea", "at"]
  }
];