import * as d3 from 'd3';
import { colorMap } from '@/services/colorMapping';
import { subCategoryMapping } from '@/services/StringMapping';

export function EventSequenceChart(data, worksheet, showAllDates = false, selectedCategories = new Set()) {
  //console.log("EventSequenceChart data:", data);

  const parsedData = data.map((d, index) => {
    let cellAddress = `B${index + 2}`;
    let cell = worksheet[cellAddress];
    let dateStr = d["Transaction Date"];
    let formattedDate;

    if (cell && cell.t === 'n') {
      const date = new Date((cell.v - 25569) * 86400 * 1000);
      let month = (date.getMonth() + 1).toString().padStart(2, '0');
      let day = date.getDate().toString().padStart(2, '0');
      let year = date.getFullYear();
      formattedDate = `${year}-${day}-${month}`;
    } else if (cell && cell.z === 'mm/dd/yyyy') {
      let dateParts = dateStr.split("/");
      if (dateParts.length === 3) {
        let month = dateParts[0].padStart(2, '0');
        let day = dateParts[1].padStart(2, '0');
        let year = dateParts[2];
        formattedDate = `${year}-${month}-${day}`;
      } else {
        formattedDate = dateStr;
      }
    } else {
      dateStr = dateStr.toString();
      let dateParts = dateStr.split("/");
      if (dateParts.length === 3) {
        let day = dateParts[0].padStart(2, '0');
        let month = dateParts[1].padStart(2, '0');
        let year = dateParts[2];
        formattedDate = `${year}-${month}-${day}`;
      } else {
        formattedDate = dateStr;
      }
    }

    const subCategory = d["subCategory"] ? d["subCategory"].trim() : 'Null';
    const transactionNumber = d["Transaction Number"] ? d["Transaction Number"] : 0;

    return {
      date: formattedDate,
      subCategory: subCategory,
      transactionNumber: transactionNumber
    };
  }).filter(d => d.date);

  const nestedData = d3.group(parsedData, d => d.date);
  const allDateArray = Array.from(nestedData.keys()).sort((a, b) => new Date(b) - new Date(a));
  const startDate = new Date(allDateArray[allDateArray.length - 1]);
  const endDate = new Date(allDateArray[0]);

  let allDates = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    allDates.push(new Date(d).toISOString().split('T')[0]);
  }
  allDates.push(endDate.toISOString().split('T')[0]);
  allDates.sort((a, b) => new Date(b) - new Date(a));

  const subCategories = Array.from(new Set(parsedData.map(d => d.subCategory))).sort((a, b) => a.localeCompare(b));

  const color = d3.scaleOrdinal()
    .domain(subCategories)
    .range(subCategories.map(subCategory => colorMap[subCategory] || "#000000")); // 默认颜色为黑色

  d3.select("#event-sequence-header .legend-container").remove();

  function updateCellsVisibility() {
    d3.selectAll('.event-rect')
      .style('opacity', d => selectedCategories.has(d.subCategory) ? 1 : 0.1);
  }

  const margin = { top: 20, right: 120, bottom: 20, left: 200 };
  const containerWidth = document.getElementById('event-sequence').clientWidth  || 700;
  const dayHeight = 20;
  const cellWidth = 15;

  let useDates = showAllDates ? allDates : Array.from(nestedData.keys());

  const containerHeight = Math.max((useDates.length + 15) * (dayHeight + 1.8) + margin.top + margin.bottom, 800);
  // console.log("useDates length:", useDates.length);
  // console.log("Calculated containerHeight:", containerHeight);

  d3.select("#event-sequence svg").remove();
  const svg = d3.select("#event-sequence")
    .append("svg")
    .attr("width", containerWidth)
    .attr("height", containerHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  let index = 0;
  const existingDates = new Set(nestedData.keys());

  const dailySequences = {};
  let previousYear = null;
  const yearPositions = {};

  useDates.forEach(date => {
    const year = new Date(date).getFullYear();

    if (year !== previousYear) {
      if (index != 0) {
        index++;  //给每一年起始位置来一行间隔
      }

      svg.append("g")
        .attr("transform", `translate(0, ${index * dayHeight})`)
        .append("text")
        .attr("class", "year-label")
        .attr("id", `year-${year}`) // 添加锚点ID
        .attr("x", -90)
        .attr("y", dayHeight / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "start")
        .text(`${year}`);

      yearPositions[year] = index * dayHeight;
      previousYear = year;
      index++; // 增加 index 以确保年份文本占据整行
    }

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).substring(0, 2);

    const g = svg.append("g")
      .attr("transform", `translate(0, ${index * dayHeight})`);

    if (existingDates.has(date)) {
      const transactions = nestedData.get(date);

      transactions.sort((b, a) => a.transactionNumber - b.transactionNumber);

      // 将每个交易的子类别拼接成字符串
      let sequence = transactions.map(t => {
        const subCategoryCode = subCategoryMapping[t.subCategory] || '0';
        return `${subCategoryCode}`;
      }).join("");

      // console.log(`Date: ${date}, Sequence: ${sequence}`);

      dailySequences[date] = sequence;

      g.selectAll("rect")
        .data(transactions)
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * cellWidth - 20)
        .attr("y", 0)
        .attr("width", cellWidth)
        .attr("height", dayHeight - 2)
        .attr("class", "event-rect")
        .attr("fill", d => color(d.subCategory));
    }

    g.append("text")
      .attr("class", "text-style")
      .attr("x", -90)
      .attr("y", dayHeight / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "start")
      .text(date.slice(5)); // 只输出 "MM-DD"

    g.append("rect")
      .attr("x", -150)
      .attr("y", dayHeight / 2 - 10)
      .attr("width", 60)
      .attr("height", 20)
      .attr("fill", "none");

    g.append("text")
      .attr("class", "text-style")
      .attr("x", -130)
      .attr("y", dayHeight / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")  // 中心对齐
      .text(dayOfWeek);

    index++;
  });
  console.log("Final index value:", index);

  updateCellsVisibility();

  d3.select("#select-all").on("click", () => {
    selectedCategories = new Set(subCategories);
    updateCellsVisibility();
  });

  d3.select("#clear-all").on("click", () => {
    selectedCategories = new Set();
    updateCellsVisibility();
  });

  // 计算交易序列的频率
  //const sequenceFrequencies = calculateSequenceFrequency(dailySequences);
  //console.log("sequenceFrequencies:", sequenceFrequencies);

  // 找出相似的交易序列
  //const similarSequences = findSimilarSequences(sequenceFrequencies);
  //console.log("similarSequences:", similarSequences);

  // console.log("dailySequences:", dailySequences);
  return { dailySequences, yearPositions };
}
