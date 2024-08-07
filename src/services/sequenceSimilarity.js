// Levenshtein 距离
function levenshteinDistance(a, b) {
  // a = 'example';
  // b = 'exampel';
  // console.log("Using Levenshtein Distance");
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

  // console.log('Levenshtein distance:', matrix[b.length][a.length]);

  return matrix[b.length][a.length];
}

// Damerau-Levenshtein 距离
function damerauLevenshteinDistance(a, b) {
  // a = 'example';
  // b = 'exampel';
  // console.log("Using Damerau-Levenshtein Distance");
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

      // 换位
      if (i > 1 && j > 1 && b.charAt(i - 1) === a.charAt(j - 2) && b.charAt(i - 2) === a.charAt(j - 1)) {
        matrix[i][j] = Math.min(
          matrix[i][j],
          matrix[i - 2][j - 2] + 1 // 换位
        );
      }
    }
  }

  // console.log('Damerau-Levenshtein distance:', matrix[b.length][a.length]);

  return matrix[b.length][a.length];
}

// Hamming 距离
function hammingDistance(a, b) {
  // console.log("Using Hamming Distance");
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
  // console.log("Using Jaro-Winkler Distance");
  if (!s1 || !s2) return Infinity;

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
  } else {
    throw new Error(`Unknown algorithm: ${algorithm}`);
  }

  // const maxLength = Math.max(sequence1.length, sequence2.length);
  // return (1 - distance / maxLength) * 100;
  const length = sequence1.length;
  // console.log('original sequence length:', length);
  // console.log('original sequence:', sequence1);
  return (1-distance/length)*100;
}

//Jaro-Winkler 距离必须使用对应的Jaro-Winkler相似度
function calculateJaroWinklerSimilarity(sequence1, sequence2) {
  return (1 - jaroWinklerDistance(sequence1, sequence2))*100;
}

// 找出与指定序列最相似的十个序列
export function findTopSimilarSequences(targetSequence, allSequences, algorithm = 'levenshtein', topN = 11) {
  const similarities = allSequences
    // .filter(seq => seq.date !== targetSequence.date) // 过滤掉自身序列
    .map(seq => {
      const similarity = algorithm === 'jaro-winkler'
        ? calculateJaroWinklerSimilarity(targetSequence, seq.sequence)
        : calculateSimilarity(targetSequence, seq.sequence, algorithm);
      return {
        date: seq.date,
        sequence: seq.sequence,
        similarity
      };
    });

  similarities.sort((a, b) => b.similarity - a.similarity);

  return similarities.slice(0, topN);
}



export function findTopSimilarSequencesByAmount(targetSequence, allSequences, topN = 10) {
  // 新建一个变量，用于存储 targetSequence 的新数组
  const targetAmounts = targetSequence.creditAmounts.map((credit, index) => {
    // 将 creditAmounts 和 debitAmounts 中的值相加
    return credit + targetSequence.debitAmounts[index];
  });

  // 遍历所有待比较的序列，创建新数组
  const allSequenceAmounts = allSequences.map(seq => {
    // 对于每个序列，创建一个新的数组，类似于 targetAmounts 的处理
    const newAmounts = seq.creditAmounts.map((credit, index) => {
      // 将 creditAmounts 和 debitAmounts 中的值相加
      return credit + seq.debitAmounts[index];
    });

    return {
      date: seq.date, // 保留日期信息以便于后续处理
      sequence: seq.sequence, // 保留原始序列信息
      newAmounts // 新生成的数组
    };
  });

  // console.log("Target Amounts Array:", targetAmounts);
  // console.log("All Sequence Amounts Arrays:", allSequenceAmounts);

  // 计算每个序列与 targetAmounts 的相似度（欧氏距离）
  const similarities = allSequenceAmounts.map(({ date, sequence, newAmounts }) => {
    // 确定两个数组中较短的一个
    const [longArray, shortArray] = targetAmounts.length >= newAmounts.length
      ? [targetAmounts, newAmounts]
      : [newAmounts, targetAmounts];

    const lengthDifference = longArray.length - shortArray.length;

    // 找出长数组中最小值的索引位置，并在短数组对应位置插入0
    const indicesToInsertZero = [];
    for (let i = 0; i < lengthDifference; i++) {
      // 找出未被使用的最小值的索引位置
      let minIndex = -1;
      let minValue = Infinity;

      for (let j = 0; j < longArray.length; j++) {
        if (!indicesToInsertZero.includes(j) && longArray[j] < minValue) {
          minValue = longArray[j];
          minIndex = j;
        }
      }
      indicesToInsertZero.push(minIndex);
    }

    // 在短数组中插入0
    const extendedShortArray = [...shortArray];
    indicesToInsertZero.forEach(index => {
      extendedShortArray.splice(index, 0, 0); // 在指定位置插入 0
    });

    // 输出插入0之后的两个数组
    // console.log("Long Array:", longArray);
    // console.log("Extended Short Array:", extendedShortArray);

    // 计算欧氏距离
    const distance = Math.sqrt(
      longArray.reduce((sum, val, index) => {
        return sum + Math.pow(val - extendedShortArray[index], 2);
      }, 0)
    );

    return {
      date,
      sequence,
      similarity: -distance // 这里使用负距离作为相似度，越大越相似
    };
  });

  // 按相似度排序并返回前 topN 个相似序列
  similarities.sort((a, b) => b.similarity - a.similarity);
  console.log('基于amount的相似序列计算结果：', similarities.slice(0, topN));

  return similarities.slice(0, topN);
}


