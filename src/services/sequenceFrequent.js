export function calculateSequenceFrequency(dailySequences) {
  const sequenceCounts = {};

  for (const date in dailySequences) {
    const sequence = dailySequences[date];
    if (sequenceCounts[sequence]) {
      sequenceCounts[sequence]++;
    } else {
      sequenceCounts[sequence] = 1;
    }
  }

  const sortedSequences = Object.keys(sequenceCounts).map(sequence => ({
    sequence: sequence,
    count: sequenceCounts[sequence]
  })).sort((a, b) => b.count - a.count);

  console.log("Most frequent 10 sequences:", sortedSequences.slice(0, 10));
  return sortedSequences;
}
