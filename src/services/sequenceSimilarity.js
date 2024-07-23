// Levenshtein 距离
function levenshteinDistance(a, b) {
  console.log("Using Levenshtein Distance");
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

// Damerau-Levenshtein 距离
function damerauLevenshteinDistance(a, b) {
  console.log("Using Damerau-Levenshtein Distance");
  if (!a || !b) return Infinity;

  const lenA = a.length;
  const lenB = b.length;
  const matrix = [];

  for (let i = 0; i <= lenA; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= lenB; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,    // 删除
        matrix[i][j - 1] + 1,    // 插入
        matrix[i - 1][j - 1] + cost // 替换
      );

      if (i > 1 && j > 1 && a.charAt(i - 1) === b.charAt(j - 2) && a.charAt(i - 2) === b.charAt(j - 1)) {
        matrix[i][j] = Math.min(
          matrix[i][j],
          matrix[i - 2][j - 2] + cost // 换位
        );
      }
    }
  }

  return matrix[lenA][lenB];
}

// Hamming 距离
function hammingDistance(a, b) {
  console.log("Using Hamming Distance");
  if (a.length !== b.length) return Infinity;

  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    if (a.charAt(i) !== b.charAt(i)) {
      distance++;
    }
  }

  return distance;
}

// Jaro-Winkler 距离
function jaroWinklerDistance(s1, s2) {
  console.log("Using Jaro-Winkler Distance");
  if (s1 === s2) return 0;

  const len1 = s1.length;
  const len2 = s2.length;
  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
  const matches1 = Array(len1).fill(false);
  const matches2 = Array(len2).fill(false);

  let matches = 0;
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, len2);
    for (let j = start; j < end; j++) {
      if (matches2[j]) continue;
      if (s1.charAt(i) === s2.charAt(j)) {
        matches1[i] = true;
        matches2[j] = true;
        matches++;
        break;
      }
    }
  }

  if (matches === 0) return 1;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (matches1[i]) {
      while (!matches2[k]) k++;
      if (s1.charAt(i) !== s2.charAt(k)) transpositions++;
      k++;
    }
  }
  transpositions /= 2;

  const jaro = (matches / len1 + matches / len2 + (matches - transpositions) / matches) / 3;
  const prefix = s1.split('').findIndex((c, i) => c !== s2.charAt(i)) || 0;
  const p = 0.1;
  return 1 - (jaro + Math.min(prefix, 4) * p * (1 - jaro));
}


// 计算相似度百分比
function calculateSimilarity(sequence1, sequence2, algorithm) {
  if (!sequence1 || !sequence2) return 0; // 确保字符串非空

  let distance;
  if (algorithm === 'levenshtein') {
    distance = levenshteinDistance(sequence1, sequence2);
  } else if (algorithm === 'damerau-levenshtein') {
    distance = damerauLevenshteinDistance(sequence1, sequence2);
  } else if (algorithm === 'hamming') {
    distance = hammingDistance(sequence1, sequence2);
  } else if (algorithm === 'jaro-winkler') {
    distance = jaroWinklerDistance(sequence1, sequence2);
  } else {
    throw new Error(`Unknown algorithm: ${algorithm}`);
  }

  const maxLength = Math.max(sequence1.length, sequence2.length);
  return (1 - distance / maxLength) * 100;
}

// 找出与指定序列最相似的十个序列
export function findTopSimilarSequences(targetSequence, allSequences, algorithm = 'levenshtein', topN = 10) {
  const similarities = allSequences.map(seq => ({
    date: seq.date,
    sequence: seq.sequence,
    similarity: calculateSimilarity(targetSequence, seq.sequence, algorithm)
  }));

  similarities.sort((a, b) => b.similarity - a.similarity);

  return similarities.slice(0, topN);
}
