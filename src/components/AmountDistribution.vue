<template>
  <div class="amount-distribution">
    <div id="amount-distribution-chart"></div>
  </div>
</template>

<script>
import * as d3 from 'd3';
import { colorMap } from '@/services/colorMapping.js';

export default {
  name: 'AmountDistribution',
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
      // 定义各个 Category 内部 subCategory 的顺序
      const subCategoryOrder = {
        "Daily expenses and consumption": [
          "Groceries", "Entertainment", "Amazon", "Dine Out", "Travel", "Fitness", "Food Shopping", "Clothes"
        ],
        "Financial management and transfers": [
          "Savings", "Bills", "Cash", "Account transfer"
        ],
        "Housing and facilities": [
          "Home Improvement", "Hotels", "Services/Home Improvement", "Mortgage", "Rent"
        ],
        "Income and investments": [
          "Investment", "Supplementary Income", "Travel Reimbursement", "Safety Deposit Return", "Interest", "Paycheck", "Purchase of uk.eg.org"
        ],
        "Insurance and Health": [
          "Insurance", "Health"
        ],
        "Other miscellaneous": [
          "Others", "Null", "Services", "Other Shopping"
        ]
      };

      // 计算每个交易的总金额（Debit Amount + Credit Amount），同时保留 subCategory 和 Category 信息
      const amountData = data.map(d => ({
        amount: (d["Debit Amount"] || 0) + (d["Credit Amount"] || 0),
        subCategory: d.subCategory || "Null",
        category: d.Category || "Unknown"
      }));

      // 定义金额区间
      const bins = [
        { range: "0-1", min: 0, max: 1 },
        { range: "1-5", min: 1, max: 5 },
        { range: "5-10", min: 5, max: 10 },
        { range: "10-20", min: 10, max: 20 },
        { range: "20-50", min: 20, max: 50 },
        { range: "50-100", min: 50, max: 100 },
        { range: "100-500", min: 100, max: 500 },
        { range: "500-1000", min: 500, max: 1000 },
        { range: "1000-5000", min: 1000, max: 5000 },
        { range: "5000+", min: 5000, max: Infinity },
      ];

      // 计算每个区间的交易数量，并统计每个 subCategory 的数量
      const binCounts = bins.map(bin => {
        const filteredData = amountData.filter(d => d.amount > bin.min && d.amount <= bin.max);

        const subCategoryCounts = d3.rollup(
          filteredData,
          v => v.length,
          d => d.subCategory
        );

        // 将 subCategory 数据转换为数组，并根据 Category 和 subCategoryOrder 中的顺序进行排序
        const sortedSubCategories = Array.from(subCategoryCounts, ([subCategory, count]) => {
          const category = filteredData.find(d => d.subCategory === subCategory)?.category || "Unknown";
          return { subCategory, count, category };
        }).sort((a, b) => {
          // 按 Category 排序
          if (a.category !== b.category) {
            return Object.keys(subCategoryOrder).indexOf(b.category) - Object.keys(subCategoryOrder).indexOf(a.category);
          } else {
            // 如果 Category 相同，则按 subCategoryOrder 排序
            return subCategoryOrder[a.category].indexOf(b.subCategory) - subCategoryOrder[a.category].indexOf(a.subCategory);
          }
        });

        return {
          range: bin.range,
          subCategories: sortedSubCategories,
          count: filteredData.length // 总交易数量
        };
      });

      // 设置图表的宽度、高度和边距
      const margin = { top: 65, right: 30, bottom: 135, left: 40 };
      const width = 500 - margin.left - margin.right;
      const height = 570 - margin.top - margin.bottom;

      // 创建 SVG 容器
      const svg = d3.select("#amount-distribution-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // X 轴
      const x = d3.scaleBand()
        .domain(binCounts.map(d => d.range))
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
        .domain([0, d3.max(binCounts, d => d.count)])
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

      // 绘制堆叠条形图
      binCounts.forEach(bin => {
        let cumulativeHeight = 0; // 用于计算堆叠高度

        bin.subCategories.forEach(subCategoryData => {
          svg.append("rect")
            .attr("x", x(bin.range))
            .attr("y", y(cumulativeHeight + subCategoryData.count))
            .attr("width", x.bandwidth())
            .attr("height", y(cumulativeHeight) - y(cumulativeHeight + subCategoryData.count))
            .attr("fill", colorMap[subCategoryData.subCategory] || "transparent")
            .on("mouseover", () => {
              tooltip.style("visibility", "visible")
                .html(`Category: ${subCategoryData.category}<br>SubCategory: ${subCategoryData.subCategory}<br>Count: ${subCategoryData.count}`);
            })
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

          cumulativeHeight += subCategoryData.count; // 更新累计高度
        });

        // 在堆叠条形图的顶部添加文本，显示总高度
        svg.append("text")
          .attr("x", x(bin.range) + x.bandwidth() / 2)
          .attr("y", y(cumulativeHeight) - 5)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .text(bin.count);

      });

      // X 轴标题
      svg.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 80)
        .attr("font-size", "13px")
        .text("Amount Range (unit: BGP)");

      // Y 轴标题
      svg.append("text")
        .attr("class", "y-axis-label")
        .attr("text-anchor", "start")
        .attr("x", -margin.left)
        .attr("y", -15)
        .attr("font-size", "13px")
        .text("Transaction Number");

      // 添加图表标题
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2 - 15)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Amount Distribution");

    }

  }

};
</script>

<style scoped>
.amount-distribution {
  padding: 10px;
  height: 100%;
}

#amount-distribution-chart {
  width: 100%;
  height: 100%;
  margin-top: 10px;
}
</style>
