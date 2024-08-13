//分别找各个模式中最高频的序列（非常花时间。可能导致浏览器崩溃）
export function findMostSimilarSequence(dailySequences, dailyAmounts, selectedOption, selectedAlgorithm) {
  const sequences = dailySequences.value || dailySequences;
  const amountsData = dailyAmounts.value || dailyAmounts;
  // console.log('amountsData', amountsData);

  let maxSimilarCount = 0;
  let mostSimilarSequence = null;

  const sequenceKeys = Object.keys(sequences);
  const sequenceLength = sequenceKeys.length;

  // 对所有序列进行两两比较
  for (let i = 0; i < sequenceLength; i++) {
    const targetDate = sequenceKeys[i];
    const targetSequence = sequences[targetDate];

    // 确保目标序列有效
    if (!targetSequence || typeof targetSequence !== 'string') {
      continue;
    }

    let similarCount = 0;

    for (let j = 0; j < sequenceLength; j++) {
      if (i === j) continue; // 跳过自身比较

      const compareDate = sequenceKeys[j];
      const compareSequence = sequences[compareDate];

      // 确保待比较序列有效
      if (!compareSequence || typeof compareSequence !== 'string') {
        continue;
      }

      let similarity;

      if (selectedOption === 'category') {
        // 根据 selectedAlgorithm 调用不同的相似度计算函数
        if (selectedAlgorithm === 'jaro-winkler') {
          similarity = calculateJaroWinklerSimilarity(targetSequence, compareSequence);
        } else {
          similarity = calculateSimilarity(targetSequence, compareSequence, selectedAlgorithm);
        }

        // 统计相似度在 75% 以上的序列数量
        if (similarity >= 75) {
          similarCount++;
        }

      } else if (selectedOption === 'amount') {
        const targetAmounts = amountsData[targetDate];
        const compareAmounts = amountsData[compareDate];

        // console.log('targetAmounts', targetAmounts);
        // console.log('compareAmounts', compareAmounts);

        const distance = calculateEuclideanDistance(targetAmounts, compareAmounts);

        // 统计距离较小的序列数量
        const distanceThreshold = 10;   //假设距离小于某个阈值算为相似
        if (distance <= distanceThreshold) {
          similarCount++;
        }
      }
    }

    // 更新拥有最多相似序列的序列信息
    if (similarCount > maxSimilarCount) {
      maxSimilarCount = similarCount;
      mostSimilarSequence = {
        date: targetDate,
        sequence: targetSequence,
        similarCount,
        debitAmounts: dailyAmounts[targetDate]?.debitAmounts || [],
        creditAmounts: dailyAmounts[targetDate]?.creditAmounts || [],
      };
    }
  }

  if (mostSimilarSequence) {
    console.log('Most Similar Sequence:', mostSimilarSequence, 'Similar Sequence Count', maxSimilarCount);
  } else {
    console.log('No similar sequences found.');
  }

  return mostSimilarSequence;
}

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

// 欧式距离
export function calculateEuclideanDistance(sequence1, sequence2) {
  // 处理第一个序列，创建一个新数组，将 creditAmounts 和 debitAmounts 中的值相加
  const amounts1 = sequence1.creditAmounts.map((credit, index) => {
    return credit + sequence1.debitAmounts[index];
  });

  // 处理第二个序列，创建一个新数组，将 creditAmounts 和 debitAmounts 中的值相加
  const amounts2 = sequence2.creditAmounts.map((credit, index) => {
    return credit + sequence2.debitAmounts[index];
  });

  // 确定两个数组中较长的一个
  const [longArray, shortArray] = amounts1.length >= amounts2.length
    ? [amounts1, amounts2]
    : [amounts2, amounts1];

  const lengthDifference = longArray.length - shortArray.length;

  // 找出长数组中最小值的索引位置，并在短数组对应位置插入0
  const indicesToInsertZero = [];
  for (let i = 0; i < lengthDifference; i++) {
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

  // console.log('Euclidean Distance:', distance);

  return distance;
}

//Jaro-Winkler 距离必须使用对应的Jaro-Winkler相似度
function calculateJaroWinklerSimilarity(sequence1, sequence2) {
  return (1 - jaroWinklerDistance(sequence1, sequence2))*100;
}

// 计算相似度百分比（基于种类）
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

// 找出与指定序列最相似的十个序列（基于分类）
export function findTopSimilarSequences(targetSequence, allSequences, algorithm = 'levenshtein', topN = 10) {
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

// 找出与指定序列最相似的十个序列（基于金额）
export function findTopSimilarSequencesByAmount(targetSequence, allSequences, topN = 10) {
  // 遍历所有待比较的序列，计算与 targetSequence 的欧氏距离
  const similarities = allSequences.map(seq => {
    // 调用 calculateEuclideanDistance 函数计算欧氏距离
    const distance = calculateEuclideanDistance({
      creditAmounts: seq.creditAmounts,
      debitAmounts: seq.debitAmounts
    }, {
      creditAmounts: targetSequence.creditAmounts,
      debitAmounts: targetSequence.debitAmounts
    });

    return {
      date: seq.date, // 保留日期信息以便于后续处理
      sequence: seq.sequence, // 保留原始序列信息
      similarity: distance // 这里使用距离作为相似度，距离越小越相似
    };
  });

  // 按相似度排序并返回前 topN 个相似序列
  similarities.sort((a, b) => a.similarity - b.similarity);
  // console.log('基于amount的相似序列计算结果：', similarities.slice(0, topN));

  return similarities.slice(0, topN);
}

// 找出与指定序列最相似的十个序列（同时基于分类和金额）
export function findTopSimilarSequencesCombined(targetSequence, allSequences, algorithm = 'levenshtein', topN = 10) {
  // 计算每个序列的相似度
  const similarities = allSequences.map(seq => {
    // 计算基于分类的相似度
    const categorySimilarity = algorithm === 'jaro-winkler'
      ? calculateJaroWinklerSimilarity(targetSequence.sequence, seq.sequence)
      : calculateSimilarity(targetSequence.sequence, seq.sequence, algorithm);

    // 计算基于金额的欧氏距离
    const amountDistance = calculateEuclideanDistance({
      creditAmounts: seq.creditAmounts,
      debitAmounts: seq.debitAmounts
    }, {
      creditAmounts: targetSequence.creditAmounts,
      debitAmounts: targetSequence.debitAmounts
    });

    // 对欧氏距离进行对数缩放处理，避免直接使用较大的距离值
    const logDistance = Math.log1p(amountDistance); // log1p(x) 等价于 log(1 + x)，对小距离值更友好

    // 归一化 logDistance 到 [0, 1] 范围
    const normalizedLogDistance = logDistance / (1 + logDistance);

    // 将归一化的距离转换为相似度
    const amountSimilarity = 1 - normalizedLogDistance; // 距离越小，相似度越高

    // 计算分类相似度和金额相似度的平均值
    const combinedSimilarity = (categorySimilarity + amountSimilarity) / 2;

    return {
      date: seq.date,
      sequence: seq.sequence,
      categorySimilarity,
      amountSimilarity,
      combinedSimilarity
    };
  });

  // 按相似度排序，并返回前 topN 个最相似的序列
  similarities.sort((a, b) => b.combinedSimilarity - a.combinedSimilarity);
  // console.log('combined mode similarity result:', similarities.slice(0, topN));

  return similarities.slice(0, topN);
}
