import * as d3 from 'd3';

export function mapHeight(parsedData) {
  // 定义每个区间对应的高度
  const segmentHeights = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105, 115,
                          125, 135, 145, 155, 165, 175, 185, 195, 205,
                          215, 225, 235, 245, 255, 265, 275, 285, 295,
                          305, 315, 325, 335, 345, 355, 365, 375, 385,
                          395, 405, 415, 425, 435, 445, 455, 465, 475, 485];

  // 定义每个区间的上限值
  const segments = [1, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900,
                    1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
                    5500 ,6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500,
                    10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000,
                    55000, 60000, 65000, 70000, 75000, 80000, 85000, 90000, 95000, 100000]; //共49个值

  parsedData.forEach(d => {
    const amount = d.debitAmount + d.creditAmount;
    // 找到金额所对应的分段，并获取相应的高度
    const segmentIndex = segments.findIndex(limit => amount <= limit);
    d.mappedHeight = segmentIndex !== -1 ? segmentHeights[segmentIndex] : segmentHeights[segmentHeights.length - 1];
  });

  return parsedData;
}


export function mapWidth(parsedData) {
  const maxTransactionValue = d3.max(parsedData, d => d.debitAmount + d.creditAmount);

  const widthScale = d3.scaleLinear()
    .domain([0, maxTransactionValue])
    .range([10, 600]);  // 可以根据需要调整范围

  // Update each transaction's width
  parsedData.forEach(d => {
    d.mappedWidth = widthScale(d.debitAmount + d.creditAmount);
  });

  return parsedData;
}

export function mapArea(parsedData) {
  const maxTransactionValue = d3.max(parsedData, d => d.debitAmount + d.creditAmount);
  const maxArea = 400 * 400; // 最大面积, 可根据需要调整

  const areaScale = d3.scaleLinear()
    .domain([0, maxTransactionValue])
    .range([225, maxArea]);

  // Update each transaction's area, width, and height
  parsedData.forEach(d => {
    const area = areaScale(d.debitAmount + d.creditAmount);
    d.mappedHeight = Math.sqrt(area); // 高度为面积的平方根
    d.mappedWidth = Math.sqrt(area); // 宽度为面积的平方根
  });

  return parsedData;
}
