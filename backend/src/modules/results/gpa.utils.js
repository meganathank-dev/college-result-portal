export const roundToTwo = (value) => {
  return Number(Number(value || 0).toFixed(2));
};

export const calculateGPA = (processedResults) => {
  const passedResults = processedResults.filter((item) => item.creditsEarned > 0);

  const numerator = passedResults.reduce(
    (sum, item) => sum + (item.gradePoint * item.creditsEarned),
    0
  );

  const denominator = passedResults.reduce(
    (sum, item) => sum + item.creditsEarned,
    0
  );

  if (denominator === 0) return 0;

  return roundToTwo(numerator / denominator);
};

export const calculateCGPA = (allProcessedResultsForStudent) => {
  const passedResults = allProcessedResultsForStudent.filter((item) => item.creditsEarned > 0);

  const numerator = passedResults.reduce(
    (sum, item) => sum + (item.gradePoint * item.creditsEarned),
    0
  );

  const denominator = passedResults.reduce(
    (sum, item) => sum + item.creditsEarned,
    0
  );

  if (denominator === 0) return 0;

  return roundToTwo(numerator / denominator);
};