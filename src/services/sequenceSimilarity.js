// Levenshtein 距离
function levenshteinDistance(a, b) {
  if (!a || !b) return Infinity; // 确保字符串非空

  const matrix = [];

  // 初始化矩阵
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // 填充矩阵
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 替换
          matrix[i][j - 1] + 1,     // 插入
          matrix[i - 1][j] + 1      // 删除
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// 计算相似度百分比
function calculateSimilarity(sequence1, sequence2) {
  if (!sequence1 || !sequence2) return 0; // 确保字符串非空

  const distance = levenshteinDistance(sequence1, sequence2);
  const maxLength = Math.max(sequence1.length, sequence2.length);
  return (1 - distance / maxLength) * 100;
}

// 找出相似的交易序列
export function findSimilarSequences(sortedSequences, threshold = 90) {
  const similarGroups = [];

  for (let i = 0; i < sortedSequences.length; i++) {
    const group = [{ sequence: sortedSequences[i], similarity: 100 }]; // 自己与自己的相似度为100%

    for (let j = i + 1; j < sortedSequences.length; j++) {
      const similarity = calculateSimilarity(sortedSequences[i].sequence, sortedSequences[j].sequence);
      if (similarity >= threshold) {
        group.push({ sequence: sortedSequences[j], similarity });
      }
    }

    if (group.length > 1) {
      similarGroups.push(group);
    }
  }

  return similarGroups;
}

// 找出与指定序列最相似的十个序列
export function findTopSimilarSequences(targetSequence, allSequences, topN = 10) {
  const similarities = allSequences.map(seq => ({
    date: seq.date,
    sequence: seq.sequence,
    similarity: calculateSimilarity(targetSequence, seq.sequence)
  }));

  similarities.sort((a, b) => b.similarity - a.similarity);

  return similarities.slice(0, topN);
}
