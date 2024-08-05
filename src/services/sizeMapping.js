// import * as d3 from 'd3';

// 每个区间在图中对应的高度（共46个值）
export const segmentHeights =
  [5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105, 115,
  125, 135, 145, 155, 165, 175, 185, 195, 205,
  215, 225, 235, 245, 255, 265, 275, 285, 295,
  305, 315, 325, 335, 345, 355, 365, 375, 385,
  395, 405, 415, 425, 435, 445, 455];

// 金额区间的上限值（共46个值）
export const segments =
  [1, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900,
  1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
  5500 , 6000,  6500,  7000,  7500,  8000,  8500,  9000,  9500,
  10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000,
  55000, 60000, 65000, 70000, 75000, 80000, 85000];

export function mapHeight(parsedData) {
  parsedData.forEach(d => {
    const amount = d.debitAmount + d.creditAmount;
    // 找到金额所对应的分段，并获取相应的高度
    const segmentIndex = segments.findIndex(limit => amount <= limit);
    d.mappedHeight = segmentIndex !== -1 ? segmentHeights[segmentIndex] : segmentHeights[segmentHeights.length - 1];
  });

  return parsedData;
}


// 每个区间在图中对应的宽度（共46个值）
export const segmentWidths = [
  5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60,
  65, 70, 75, 80, 85, 90, 95, 100, 105,
  110, 115, 120, 125, 130, 135, 140, 145, 150,
  155, 160, 165, 170, 175, 180, 185, 190, 195,
  200, 205, 210, 215, 220, 225, 230
];

// 金额区间的上限值（共46个值）
export const widthSegments = [
  1, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900,
  1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
  5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500,
  10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000,
  55000, 60000, 65000, 70000, 75000, 80000, 85000
];

export function mapWidth(parsedData) {
  parsedData.forEach(d => {
    const amount = d.debitAmount + d.creditAmount;
    // 找到金额所对应的分段，并获取相应的宽度
    const segmentIndex = widthSegments.findIndex(limit => amount <= limit);
    d.mappedWidth = segmentIndex !== -1 ? segmentWidths[segmentIndex] : segmentWidths[segmentWidths.length - 1];
  });

  return parsedData;
}


// 映射区间的面积大小（单位：平方像素），共46个值
export const areaSizes = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900,
  1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500,
  6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000, 10500,
  11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19000, 20000,
  21000, 22000, 23000, 24000, 25000, 26000
];

// 金额区间的上限值（共46个值）
export const areaSegments = [
  1, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900,
  1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
  5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500,
  10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000,
  55000, 60000, 65000, 70000, 75000, 80000, 85000
];


export function mapArea(parsedData) {
  // 更新每个交易的面积、宽度和高度
  parsedData.forEach(d => {
    const amount = d.debitAmount + d.creditAmount;
    // 找到金额所对应的分段，并获取相应的面积大小
    const segmentIndex = areaSegments.findIndex(limit => amount <= limit);
    const area = segmentIndex !== -1 ? areaSizes[segmentIndex] : areaSizes[areaSizes.length - 1];

    // 设置宽度和高度为面积的平方根
    d.mappedHeight = Math.sqrt(area); // 高度为面积的平方根
    d.mappedWidth = Math.sqrt(area); // 宽度为面积的平方根
  });

  return parsedData;
}
