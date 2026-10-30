

export function validateSentenceData(sentences) {
  if (!Array.isArray(sentences)) return false;
  return sentences.every(
    (item) =>
      typeof item.text === 'string' &&
      Array.isArray(item.words) &&
      Array.isArray(item.distractors)
  );
}