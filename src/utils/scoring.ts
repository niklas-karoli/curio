export const calculateScore = (remainingTime: number, totalTime: number): number => {
  if (remainingTime < 0) return 0;
  // Punkte = round(500 + (500 * Restzeit / Gesamtzeit))
  return Math.round(500 + (500 * (remainingTime / totalTime)));
};
