export function buildConfig({ sentences, totalRounds, perRound, timerSeconds, wordSpeed, scoring, audio, replays }) {
  return {
    totalRounds, perRound, timerSeconds, wordSpeed, scoring, audio,
    replays: replays ?? 3,
    maxScorePerRound: perRound * (scoring.correct + scoring.timeBonus),
    questions: sentences,
  };
}