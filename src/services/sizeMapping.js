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

//
// export function mapWidth(amount) {
//   return amount * 0.1; // 你可以根据实际需要调整映射比例
// }
//
// export function mapArea(amount) {
//   return Math.sqrt(amount) * 0.1; // 你可以根据实际需要调整映射比例
// }
//
// export function noMapping() {
//   return 15; // 保持现状，方格宽度/高度为 15
// }
