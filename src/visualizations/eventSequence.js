import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { colorMap } from '@/services/colorMapping';
import { subCategoryMapping } from '@/services/StringMapping';
import { mapHeight, mapWidth, mapArea  } from '@/services/sizeMapping';

export function EventSequenceChart(data, worksheet, showAllDates = false, selectedCategories = new Set(), selectedMapping = 'none') {
  //console.log("EventSequenceChart data:", data);
  console.log("EventSequenceChart selectedMapping:", selectedMapping);

  let parsedData = data.map((d, index) => {
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

    const category = d["Category"] ? d["Category"].trim() : 'Null';
    const subCategory = d["subCategory"] ? d["subCategory"].trim() : 'Null';
    const debitAmount = d["Debit Amount"] ? d["Debit Amount"] : 0;
    const creditAmount = d["Credit Amount"] ? d["Credit Amount"] : 0;
    const transactionNumber = d["Transaction Number"] ? d["Transaction Number"] : 0;

    return {
      date: formattedDate,
      category: category,
      subCategory: subCategory,
      debitAmount: debitAmount,
      creditAmount: creditAmount,
      transactionNumber: transactionNumber
    };
  }).filter(d => d.date);

  if (selectedMapping === 'height') {
    parsedData = mapHeight(parsedData);
  } else if (selectedMapping === 'width') {
    parsedData = mapWidth(parsedData);
  } else if (selectedMapping === 'area') {
    parsedData = mapArea(parsedData);
  }

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

  const margin = { top: 20, right: 320, bottom: 20, left: 200 };
  // const containerWidth = document.getElementById('event-sequence').clientWidth  || 700;
  const dayHeight = 20;
  const cellWidth = 15;

  let useDates = showAllDates ? allDates : Array.from(nestedData.keys());

  const containerHeight = Math.max((useDates.length + 300) * (dayHeight + 25) + margin.top + margin.bottom, 800);
  // console.log("useDates length:", useDates.length);
  // console.log("Calculated containerHeight:", containerHeight);

  // 初始化 d3-tip
  const tip = d3Tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(d => {
      let tooltipContent = `
      <span>Date:</span> <span>${d.date}</span><br>
      <span>Category:</span> <span>${d.category}</span><br>
      <span>SubCategory:</span> <span>${d.subCategory}</span><br>
    `;

      // Debit Amount 和 Credit Amount 为 0 时不显示
      if (d.debitAmount !== 0) {
        tooltipContent += `<span>Debit Amount:</span> <span>${d.debitAmount}</span><br>`;
      }

      if (d.creditAmount !== 0) {
        tooltipContent += `<span>Credit Amount:</span> <span>${d.creditAmount}</span>`;
      }

      return tooltipContent;
    });

  d3.select("#event-sequence svg").remove();

  const svg = d3.select("#event-sequence")
    .append("svg")
    .attr("width", 750)
    .attr("height", containerHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .call(tip);

  let index = 0;
  const existingDates = new Set(nestedData.keys());

  const dailySequences = {};
  const dailyAmounts = {};
  let previousYear = null;
  const yearPositions = {};

  useDates.forEach(date => {
    const year = new Date(date).getFullYear();

    if (year !== previousYear) {
      if (index != 0) {
        index += dayHeight;  //给每一年起始位置来一行间隔
      }

      svg.append("g")
        .attr("transform", `translate(0, ${index})`)
        .append("text")
        .attr("class", "year-label")
        .attr("id", `year-${year}`) // 添加锚点ID
        .attr("x", -135)
        .attr("y", dayHeight / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "start")
        .text(`${year}`);

      yearPositions[year] = index;
      previousYear = year;
      index += dayHeight; // 增加 index 以确保年份文本占据整行
    }
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).substring(0, 2);

    const transactions = nestedData.get(date) || [];
    const maxRectHeight = (selectedMapping === 'height' || selectedMapping === 'area') ? d3.max(transactions, d => d.mappedHeight) || dayHeight : dayHeight;
    const rowHeight = (selectedMapping === 'height' || selectedMapping === 'area') ? maxRectHeight + 2 : dayHeight; // 增加一些间隔

    const g = svg.append("g")
      .attr("transform", `translate(0, ${index})`);

    if (existingDates.has(date)) {
      transactions.sort((b, a) => a.transactionNumber - b.transactionNumber);

      // 将每个交易的子类别拼接成字符串
      let sequence = transactions.map(t => {
        const subCategoryCode = subCategoryMapping[t.subCategory] || '0';
        return `${subCategoryCode}`;
      }).join("");

      dailySequences[date] = sequence;
      dailyAmounts[date] = {
        debitAmounts: transactions.map(t => t.debitAmount),
        creditAmounts: transactions.map(t => t.creditAmount)
      };

      g.selectAll("rect")
        .data(transactions)
        .enter()
        .append("rect")
        .attr("x", (d, i) => {
          if (selectedMapping === 'width' || selectedMapping === 'area') {
            const widths = transactions.slice(0, i).map(t => t.mappedWidth || cellWidth);
            return widths.reduce((acc, w) => acc + w, -80);
          } else {
            return i * cellWidth - 80;
          }
        })
        .attr("y", d => {
          if (selectedMapping === 'height') {
            return maxRectHeight - d.mappedHeight; // 底部对齐
          } else if (selectedMapping === 'area') {
            return (maxRectHeight - d.mappedHeight) / 2; // 中心对齐
          } else {
            return 0; // 顶部对齐
          }
        })
        .attr("width", d => selectedMapping === 'width' || selectedMapping === 'area' ? d.mappedWidth : cellWidth)
        .attr("height", d => selectedMapping === 'height' || selectedMapping === 'area' ? d.mappedHeight : dayHeight - 2)
        .attr("class", "event-rect")
        .attr("fill", d => color(d.subCategory))
        .on('mouseover', function(event, d) {
          tip.show(d, this);
        })
        .on('mouseout', function(event, d) {
          tip.hide(d, this);
        });
    }

    const textYOffset = (selectedMapping === 'height')
      ? maxRectHeight
      : (selectedMapping === 'area' ? maxRectHeight / 2 : dayHeight / 2);

    g.append("text")
      .attr("class", "text-style")
      .attr("x", -135)
      .attr("y", textYOffset)
      .attr("dy", selectedMapping === 'height' ? null : "0.35em")
      .attr("text-anchor", "start")
      .text(date.slice(5)); // 只输出 "MM-DD"

    g.append("rect")
      .attr("x", -185)
      .attr("y", textYOffset - 10)
      .attr("width", 60)
      .attr("height", 20)
      .attr("fill", "none");

    g.append("text")
      .attr("class", "text-style")
      .attr("x", -160)
      .attr("y", textYOffset)
      .attr("dy", selectedMapping === 'height' ? null : "0.35em")
      .attr("text-anchor", "middle")  // 中心对齐
      .text(dayOfWeek);

    index += rowHeight; // 根据当前行的高度调整 index
  });

  // console.log("Final index value:", index);

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
  // console.log("dailyAmounts:", dailyAmounts);
  return { dailySequences, dailyAmounts, yearPositions };
}
