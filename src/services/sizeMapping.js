import * as d3 from 'd3';

export function mapHeight(parsedData) {
  const maxTransactionValue = d3.max(parsedData, d => d.debitAmount + d.creditAmount);

  const heightScale = d3.scaleLinear()
    .domain([0, maxTransactionValue])
    .range([15, 800]);

  // Update each transaction's height
  parsedData.forEach(d => {
    d.mappedHeight = heightScale(d.debitAmount + d.creditAmount);
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
