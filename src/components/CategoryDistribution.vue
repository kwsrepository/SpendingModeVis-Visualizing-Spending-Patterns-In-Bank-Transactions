<template>
  <div class="category-distribution">
    <div id="category-distribution-chart"></div>
  </div>
</template>

<script>
import * as d3 from 'd3';
import { colorMap } from '@/services/colorMapping.js';

export default {
  name: 'CategoryDistribution',
  props: {
    data: {
      type: Array,
      required: true
    },
  },
  mounted() {
    this.drawHistogram(this.data);
  },
  methods: {
    drawHistogram(data) {
      // 首先按 category 对数据进行分组，然后对每个分组内的 subCategory 进行计数
      const categoryGroupedData = d3.group(data, d => d.Category);

      const sortedCategories = Array.from(categoryGroupedData.keys()).sort((a, b) => a.localeCompare(b));

      const sortedData = [];
      sortedCategories.forEach(category => {
        const values = categoryGroupedData.get(category);

        const subCategoryCounts = d3.rollup(
          values,
          v => v.length,
          d => d.subCategory || "Null" // 如果 subCategory 是 undefined，使用 "Null" 作为默认值
        );

        const sortedSubCategories = Array.from(subCategoryCounts, ([subCategory, count]) => ({
          category,
          subCategory,
          count
        }));

        sortedData.push(...sortedSubCategories);
      });

      // 设置图表的宽度、高度和边距
      const margin = { top: 65, right: 30, bottom: 135, left: 40 };
      const width = 500 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      // 创建 SVG 容器
      const svg = d3.select("#category-distribution-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // X 轴
      const x = d3.scaleBand()
        .domain(sortedData.map(d => d.subCategory))
        .range([0, width])
        .padding(0.1);

      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

      // Y 轴
      const y = d3.scaleLinear()
        .domain([0, d3.max(sortedData, d => d.count)])
        .nice()
        .range([height, 0]);

      svg.append("g")
        .call(d3.axisLeft(y));

      // 创建 tooltip
      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border", "solid 1px #ccc")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("font-size", "12px");

      // 绘制条形图
      svg.selectAll(".bar")
        .data(sortedData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.subCategory))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", d => colorMap[d.subCategory] || "#ffffff")
        .on("mouseover", (event, d) => {
          tooltip.style("visibility", "visible")
            .html(`Category: ${d.category}<br>SubCategory: ${d.subCategory}<br>Count: ${d.count}`);        })
        .on("mousemove", event => {
          const tooltipWidth = tooltip.node().offsetWidth;
          const pageWidth = window.innerWidth;

          let tooltipX = event.pageX + 10;
          if (tooltipX + tooltipWidth > pageWidth) {
            tooltipX = event.pageX - tooltipWidth - 10;
          }

          tooltip.style("top", `${event.pageY - 50}px`)
            .style("left", `${tooltipX}px`);
        })

        .on("mouseout", () => {
          tooltip.style("visibility", "hidden");
        });

      // // X 轴标题
      // svg.append("text")
      //   .attr("class", "x-axis-label")
      //   .attr("text-anchor", "middle")
      //   .attr("x", width / 2)  // 横向居中
      //   .attr("y", height + margin.bottom - 10)  // 放在x轴正下方
      // .attr("font-size", "13px")
      //   .text("Category");

      // Y 轴标题
      svg.append("text")
        .attr("class", "y-axis-label")
        .attr("text-anchor", "start")
        .attr("x", -margin.left)  // 与y轴对齐
        .attr("y", -20)  // 放在y轴上方
        .attr("font-size", "13px")
        .text("Transaction number");

      // 添加图表标题
      svg.append("text")
        .attr("x", width / 2)  // 水平居中
        .attr("y", -margin.top / 2 - 20)  // 在SVG的上方显示标题
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Category Distribution");

    }

  }
};
</script>

<style scoped>
.category-distribution {
  padding: 10px;
  height: 100%;
}

#category-distribution-chart {
  width: 100%;
  height: 100%;
  margin-top: 50px;
}

</style>
