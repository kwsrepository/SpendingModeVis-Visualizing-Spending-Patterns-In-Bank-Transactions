<template>
  <div style="display: flex; align-items: center; height: 30px;">
    <p class="text-style" style="margin: 0 10px 0 0; font-size: 16px; line-height: 1.5;">Circle Size:</p>
    <el-input-number
      v-model="circleRadius"
      :min="1"
      :max="10"
      aria-label="Circle Radius"
      :step="0.5"
      controls-position="right"
      size="small"
      style="width: 80px; line-height: 1.5;"
    >
    </el-input-number>
  </div>

  <el-radio-group v-model="selectedYAxisOption">
    <el-radio value="normal">Normal</el-radio>
    <el-radio value="winsorize">Decrease Outlier (Cap at 5000)</el-radio>
    <el-radio value="logarithmic">Logarithmic</el-radio>
  </el-radio-group>
  <div id="time-distribution-chart"></div>
</template>

<script>
import { ElInputNumber, ElRadioGroup, ElRadio } from 'element-plus';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
import { colorMap } from '@/services/colorMapping';

export default {
  name: 'TimeDistribution',
  components: {
    ElInputNumber,
    ElRadioGroup,
    ElRadio,
  },
  props: {
    parsedData: {
      type: Array,
      required: true
    },
    selectedCategories: {
      type: Set,
      required: true
    }
  },
  data() {
    return {
      circleRadius: 3, // 默认的散点半径
      selectedYAxisOption: 'winsorize', // 默认选项为 Winsorize
    };
  },
  mounted() {
    this.drawScatterPlot();
  },
  watch: {
    selectedCategories: {
      handler() {
        d3.select("#time-distribution-chart").selectAll("*").remove();
        this.drawScatterPlot();
      },
      deep: true
    },
    circleRadius() {
      d3.select("#time-distribution-chart").selectAll("*").remove();
      this.drawScatterPlot();
    },
    selectedYAxisOption() {
      d3.select("#time-distribution-chart").selectAll("*").remove();
      this.drawScatterPlot();
    }
  },
  methods: {
    drawScatterPlot() {
      const margin = { top: 70, right: 20, bottom: 70, left: 40 };
      const width = 500 - margin.left - margin.right;
      const height = 530 - margin.top - margin.bottom;

      // 根据 y 轴选项处理金额数据
      let maxAmount = 5000;
      let filteredData;

      if (this.selectedYAxisOption === 'winsorize') {
        filteredData = this.parsedData.map(d => ({
          ...d,
          adjustedAmount: Math.min(d.debitAmount + d.creditAmount, 5000)
        }));
      } else if (this.selectedYAxisOption === 'logarithmic') {
        filteredData = this.parsedData.map(d => ({
          ...d,
          adjustedAmount: Math.log10(d.debitAmount + d.creditAmount + 1) // 确保对数变换后非负
        }));
        maxAmount = d3.max(filteredData, d => d.adjustedAmount);
      } else {
        filteredData = this.parsedData.map(d => ({
          ...d,
          adjustedAmount: d.debitAmount + d.creditAmount
        }));
        maxAmount = d3.max(filteredData, d => d.adjustedAmount);
      }

      const dates = filteredData.map(d => new Date(d.date));
      const customTicks = this.generateCustomTicks(dates);

      const svg = d3.select("#time-distribution-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleTime()
        .domain([d3.min(dates), d3.max(dates)])
        .range([0, width]);

      const xAxis = d3.axisBottom(x)
        .tickValues(customTicks)
        .tickFormat(d3.timeFormat("%Y-%m-%d"));

      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

      const y = d3.scaleLinear()
        .domain([0, maxAmount])
        .range([height, 0]);

      svg.append("g")
        .call(d3.axisLeft(y)
          .ticks(10)
          .tickFormat(this.selectedYAxisOption === 'logarithmic'
            ? d => Math.pow(10, d).toFixed(0)  // 对数轴刻度显示原始金额
            : d => d)
        );

      // 手动添加 y 轴的最大值刻度
      svg.append("g")
        .attr("transform", `translate(0, ${y(maxAmount)})`)
        .call(d3.axisLeft(y).tickValues([maxAmount])
          .tickFormat(this.selectedYAxisOption === 'logarithmic'
            ? d => Math.pow(10, d).toFixed(0)
            : d => d)
        );

      // 初始化 d3-tip
      const tip = d3Tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(event, d) {
          return `
        <strong>Date:</strong> <span>${d.date}</span><br>
        <strong>Amount:</strong> <span>${(d.debitAmount + d.creditAmount).toFixed(2)}</span><br>
        <strong>Category:</strong> <span>${d.category}</span><br>
        <strong>SubCategory:</strong> <span>${d.subCategory}</span>
      `;
        });

      svg.call(tip);

      svg.selectAll("circle")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("cx", d => x(new Date(d.date)))
        .attr("cy", d => y(d.adjustedAmount))
        .attr("r", this.circleRadius)
        .style("fill", d => colorMap[d.subCategory] || "transparent")
        .style("opacity", d => this.selectedCategories.has(d.subCategory) ? 1 : 0)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

      svg.append("text")
        .attr("x", width / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Time Distribution of Transactions");

      // Y 轴标题
      svg.append("text")
        .attr("class", "y-axis-label")
        .attr("text-anchor", "start")
        .attr("x", -margin.left)
        .attr("y", -15)
        .attr("font-size", "13px")
        .text(this.selectedYAxisOption === 'logarithmic' ? "Logarithmic Amount (unit: BGP)" : "Transaction Amount (unit: BGP)");
    },

    generateCustomTicks(dates) {
      const ticks = [];
      const startDate = d3.min(dates);
      const endDate = d3.max(dates);

      ticks.push(startDate); // 添加首日期

      let currentYear = startDate.getFullYear();

      while (currentYear <= endDate.getFullYear()) {
        const janFirst = new Date(currentYear, 0, 1); // 1月1日
        const junFirst = new Date(currentYear, 6, 1); // 7月1日

        if (janFirst >= startDate && janFirst <= endDate) {
          ticks.push(janFirst);
        }

        if (junFirst >= startDate && junFirst <= endDate) {
          ticks.push(junFirst);
        }

        currentYear++;
      }

      if (ticks[ticks.length - 1].getTime() !== endDate.getTime()) {
        ticks.push(endDate); // 添加尾日期
      }

      return ticks;
    }
  }
}
</script>

<style scoped>
#time-distribution-chart {
  width: 100%;
  height: 100%;
}

.d3-tip {
  line-height: 1;
  font-weight: bold;
  padding: 12px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  border-radius: 2px;
}

/* Creates a small triangle extender for the tooltip */
.d3-tip:after {
  box-sizing: border-box;
  display: inline;
  font-size: 10px;
  width: 100%;
  line-height: 1;
  color: rgba(0, 0, 0, 0.8);
  content: "\25BC";
  position: absolute;
  text-align: center;
}

/* Style northward tooltips differently */
.d3-tip.n:after {
  margin: -1px 0 0 0;
  top: 100%;
  left: 0;
}
</style>
