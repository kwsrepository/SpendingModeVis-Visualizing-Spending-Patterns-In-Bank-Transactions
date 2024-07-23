import * as d3 from 'd3';
import { excelDateToJSDate } from '@/services/dateUtils';

export function StackBarChart(data) {
  // 解析数据，提取年份和Transaction Type
  const parsedData = data.map(d => {
    // console.log("Row Data:", d);
    let dateStr = d["Transaction Date"];
    if (typeof dateStr === 'number') {
      // 如果是Excel日期序列，转换为JS日期
      dateStr = excelDateToJSDate(dateStr);
      dateStr = `${dateStr.getDate().toString().padStart(2, '0')}/${(dateStr.getMonth() + 1).toString().padStart(2, '0')}/${dateStr.getFullYear()}`;
    }

    if (typeof dateStr !== 'string') {
      console.error("Invalid Transaction Date:", dateStr);
      return null;
    }

    const dateParts = dateStr.split('/');
    const year = dateParts[2];
    return {
      year: year,
      type: d["Transaction Type"]
    };
  }).filter(d => d !== null && d.type && d.type.trim() !== '');  // 过滤掉无效的行和没有Transaction Type的行

  // 调试：打印解析后的数据
  // console.log("Parsed Data:", parsedData);

  // 按年份和Transaction Type聚合数据
  const nestedData = d3.rollup(
    parsedData,
    v => v.length,
    d => d.year,
    d => d.type
  );

  // console.log("Nested Data:", nestedData);

  // 转换数据为堆积条形图所需格式
  let years = Array.from(new Set(parsedData.map(d => d.year)));
  years = years.sort((a, b) => a - b);  // 将年份按升序排列
  let types = Array.from(new Set(parsedData.map(d => d.type)));
  types.sort((a, b) => a.localeCompare(b));   // 按照首字母降序排序

  // console.log("Years:", years);
  // console.log("Types:", types);

  const stackData = years.map(year => {
    const yearData = { year: year };
    types.forEach(type => {
      const yearEntry = nestedData.get(year);
      const typeData = yearEntry ? yearEntry.get(type) : null;
      yearData[type] = typeData ? typeData : 0;
    });
    return yearData;
  });

  // 移除旧的SVG
  d3.select("#chart").selectAll("*").remove();

  console.log("Stack Data:", stackData);

  const margin = { top: 20, right: 150, bottom: 60, left: 60 };
  const containerWidth = document.getElementById('chart').clientWidth;
  const containerHeight = document.getElementById('chart').clientHeight;
  const width = containerWidth - margin.left - margin.right;
  const height = containerHeight - margin.top - margin.bottom;

  const svg = d3.select("#page1 #chart")
    .append("svg")
    .attr("width", containerWidth)
    .attr("height", containerHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(years)
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .range([height, 0]);

  // 添加x轴标题
  svg.append("text")
    .attr("class", "x-axis-label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 20)
    .text("Year");

  // 添加y轴标题
  svg.append("text")
    .attr("class", "y-axis-label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 20)
    .text("Number of Transactions per Year");

  //颜色比例尺
  const color = d3.scaleOrdinal()
    .domain(types)
    .range(d3.schemeCategory10.slice(0, types.length)); // 确保颜色数量与类型数量匹配


  const stack = d3.stack()
    .keys(types);

  const series = stack(stackData);

  // 调试：打印堆积条形图系列数据
  console.log("Series Data:", series);

  y.domain([0, d3.max(series, s => d3.max(s, d => d[1]))]);

  // 获取所有Y轴刻度值
  const yTicks = y.ticks();

  // 绘制水平横线
  svg.selectAll("line.horizontalGrid").data(yTicks).enter()
    .append("line")
    .attr("class", "horizontalGrid")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", d => y(d))
    .attr("y2", d => y(d))
    .attr("stroke", "#cccccc")
    .attr("stroke-width", 1)
    .style("opacity", 0.7);

  // 绘制X轴
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  // 绘制Y轴
  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y))
    .selectAll("path")
    .style("display", "none");

  // Tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#f9f9f9")
    .style("padding", "5px 10px")
    .style("border", "1px solid #d3d3d3")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // 绘制堆积条形图
  const seriesGroup = svg.selectAll(".serie")
    .data(series)
    .enter().append("g")
    .attr("class", "serie")
    .attr("fill", d => color(d.key));

  seriesGroup.selectAll("rect")
    .data(d => d.map(v => ({...v, key: d.key})))
    .enter().append("rect")
    .attr("x", d => x(d.data.year))
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]))
    .attr("width", x.bandwidth())
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", .9);
      tooltip.html(`Year: ${d.data.year}<br>Type: ${d.key}<br>Count: ${d[1] - d[0]}`)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px");

      // 高亮当前的Transaction Type
      svg.selectAll(".serie")
        .style("opacity", 0.2);
      d3.select(event.target.parentNode)
        .style("opacity", 1);
    })
    .on("mouseout", () => {
      tooltip.transition().duration(500).style("opacity", 0);

      // 恢复所有Transaction Types的样式
      svg.selectAll(".serie")
        .style("opacity", 1);
    });

  // 添加图例
  const legendRectSize = Math.min(containerWidth, containerHeight) * 0.02;
  const legendSpacing = legendRectSize * 0.5;

  const legend = svg.selectAll(".legend")
    .data(types.filter(type => {
      return stackData.some(d => d[type] > 0);
    }).reverse())  // 颠倒图例顺序
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(0,${i * (legendRectSize + legendSpacing)})`);

  legend.append("rect")
    .attr("x", width + 20)
    .attr("width", legendRectSize)
    .attr("height", legendRectSize)
    .style("fill", color);

  legend.append("text")
    .attr("x", width + 20 + legendRectSize + legendSpacing)
    .attr("y", legendRectSize / 2)
    .attr("dy", ".35em")
    .style("text-anchor", "start")
    .style("font-size", `${legendRectSize * 0.75}px`)
    .text(d => d);
}
