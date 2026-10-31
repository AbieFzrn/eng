export function buildSentence(answer, distractorsText, question = '') {
  const words = tokenize(answer);
  return {
    question: question.trim(),   // string kosong otomatis tidak disimpan Firebase
    answer: answer.trim(),
    words: words.map((t) => ({ text: t })),
    distractors: parseDistractors(distractorsText, words).map((t) => ({ text: t })),
  };
}