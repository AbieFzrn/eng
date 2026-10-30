export const isCorrect = (target, answer) =>
  Array.isArray(target) &&
  Array.isArray(answer) &&
  answer.length === target.length &&
  answer.every((word, i) => word === target[i]);