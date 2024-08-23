<template>
  <div class="drawer-box">
    <el-drawer
      v-model="visible"
      size="40%"
      direction="rtl"
      :with-header="false"
      @close="closeDrawer"
    >
      <div class="kmeans-content">
        <h2>K-means++ Cluster Analysis</h2>
        <div class="input-container">
          <span>Select Cluster Number:</span>
          <el-input-number
            v-model="num"
            controls-position="right"
            :min="1"
            :max="10"
            aria-label="Number of Clusters"
            class="custom-input"
          />
        </div>
        <div style="margin-top: 20px">
          <el-radio-group v-model="selectedOption" @change="initializeDrawer">
            <el-radio value="none">Normal</el-radio>
            <el-radio value="winsorize">Decrease Outlier (Cap at 5000)</el-radio>
            <el-radio value="logarithmic">Logarithmic</el-radio>
          </el-radio-group>
          <div id="scatter-plot"></div>
        </div>
        <div id="bar-chart"></div>
        <div id="elbow-chart"></div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { ElDrawer, ElInputNumber, ElRadioGroup, ElRadio } from 'element-plus';
import { ref, defineComponent, watch, onMounted, nextTick } from 'vue';
import '@/assets/global.css';
// import { PCA } from 'ml-pca';
import kmeans from 'ml-kmeans';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';

export default defineComponent({
  name: "KMeans",
  components: {
    ElDrawer,
    ElInputNumber,
    ElRadioGroup,
    ElRadio,
  },
  props: {
    parsedData: {
      type: Array,
      required: true
    },
    isDarkMode: {
      type: Boolean,
      required: true
    }
  },
  setup(props) {
    const visible = ref(false);
    const num = ref(3); // 默认的数字输入值
    const selectedOption = ref('logarithmic');

    const parseDateComponents = (dateString) => {
      const startDate = new Date("2015-07-27");
      const currentDate = new Date(dateString);
      return Math.floor((currentDate - startDate) / (1000 * 3600 * 24)); // 计算相对天数
    };

    const winsorize = (data, threshold) => {
      return data.map(value => value > threshold ? threshold : value);
    };

    const minMaxScale = (data) => {
      const min = Math.min(...data);
      const max = Math.max(...data);
      return data.map(value => (value - min) / (max - min));
    };

    const initializeDrawer = () => {
      setStyles(props.isDarkMode);

      // 提取并处理数据
      const dates = props.parsedData.map(item => parseDateComponents(item.date));
      let amounts = props.parsedData.map(item => item.debitAmount + item.creditAmount);

      // 保留原始金额数据
      const tooltipAmounts = [...amounts];

      // 根据用户选择处理金额数据
      if (selectedOption.value === 'winsorize') {
        amounts = winsorize(amounts, 5000); // 对金额进行Winsorizing处理
      } else if (selectedOption.value === 'logarithmic') {
        amounts = amounts.map(value => Math.log10(value + 1)); // 使用对数处理
        // console.log('amounts', amounts);
      }

      // const amountsWinsorized = winsorize(amounts, 5000); // 对金额进行Winsorizing处理

      // 对相对天数和金额进行Min-Max标准化
      const datesScaled = minMaxScale(dates);
      const amountsScaled = minMaxScale(amounts);

      // 组合特征向量并输出到控制台
      const featureVectors = props.parsedData.map((item, index) => {
        return {
          originalDate: item.date,
          originalAmount: amounts[index],
          // originalSubCategory: item.subCategory,
          tooltipAmounts: tooltipAmounts[index],
          // Date: item.date,
          date: datesScaled[index],
          amount: amountsScaled[index],
        };
      });

      // console.log('Processed Feature Vectors:', featureVectors);

      // 将特征向量转换为适合聚类的格式
      const kMeansInput = featureVectors.map(vector => [
        vector.date,
        vector.amount
      ]);

      // 执行 k-means++ 聚类，使质心之间的距离尽可能较远
      const kmeansResult = kmeans(kMeansInput, num.value, { initialization: 'kmeans++' }); // 使用用户选择的簇数

      // 将聚类结果添加到 featureVectors 中
      const clusteredData = featureVectors.map((vector, index) => ({
        ...vector,
        cluster: kmeansResult.clusters[index],
      }));

      // console.log('Clustered Data:', clusteredData);

      // 绘制聚类结果的散点图
      drawScatterPlot(clusteredData);

      // 绘制 subCategory 的柱状图
      // drawBarChart(clusteredData, uniqueSubCategories);

      // 肘部法 elbow method
      const calculateElbowData = (data, maxK = 10) => {
        const sseValues = [];

        for (let k = 1; k <= maxK; k++) {
          const kmeansResult = kmeans(data, k);
          const sse = kmeansResult.centroids.reduce((sum, centroidObj, i) => {
            const centroidArray = Array.isArray(centroidObj) ? centroidObj : Object.values(centroidObj)[0];
            const clusterPoints = data.filter((_, index) => kmeansResult.clusters[index] === i);
            const distanceSum = clusterPoints.reduce((total, point) => {
              const distance = Math.sqrt(
                point.reduce((distSum, coord, j) => distSum + Math.pow(coord - centroidArray[j], 2), 0)
              );
              return total + Math.pow(distance, 2);
            }, 0);
            return sum + distanceSum;
          }, 0);
          sseValues.push({ k, sse });
        }

        return sseValues;
      };

      const elbowData = calculateElbowData(kMeansInput);

      drawElbowChart(elbowData);
    };

    const openDrawer = () => {
      visible.value = true;
      nextTick(initializeDrawer); // 确保在 drawer 打开后再初始化数据
    };

    const closeDrawer = () => {
      visible.value = false;
    };

    watch(num, () => {
      if (visible.value) {
        initializeDrawer(); // 当 num 改变时重新加载数据
      }
    });

    const setStyles = (isDark) => {
      const drawerElement = document.querySelector('.drawer-box .el-drawer__body');
      if (drawerElement) {
        drawerElement.style.backgroundColor = isDark ? '#ffffff' : '#141414';
        drawerElement.style.color = isDark ? '#141414' : '#ffffff'; // 字体颜色
      }
    };

    const drawScatterPlot = (data) => {
      const margin = { top: 50, right: 10, bottom: 40, left: 65 };
      const width = 500 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      d3.select("#scatter-plot").selectAll("*").remove();

      const svg = d3.select("#scatter-plot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // x 轴使用原始日期
      const x = d3.scaleTime()
        .domain(d3.extent(data, d => new Date(d.originalDate))) // 使用原始日期
        .range([0, width]);

      // y 轴使用原始金额进行对数变换的显示
      const maxYValue = d3.max(data, d => d.originalAmount);
      const y = d3.scaleLinear()
        .domain([0, maxYValue]) // 使用原始金额
        .range([height, 0]);

      // 添加 x 轴
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(10).tickSizeOuter(0));

      // 添加 y 轴，并自定义刻度标签，同时增加最大值刻度
      svg.append("g")
        .call(d3.axisLeft(y)
          .ticks(10)
          .tickSizeOuter(0)
          .tickValues([...y.ticks(10), maxYValue]) // 添加最大值刻度
          .tickFormat(selectedOption.value === 'logarithmic'
            ? d => (Math.pow(10, d) > 1 ? Math.pow(10, d).toFixed(0) : Math.pow(10, d).toPrecision(1)) // 显示对数前的原始金额
            : d => d)); // 其他模式，正常显示金额

      const color = d3.scaleOrdinal(d3.schemeCategory10);

      // 定义并初始化 tooltip
      const tip = d3Tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(event, d) {
          return `<strong>Date:</strong> ${d.originalDate}<br>
              <strong>Amount:</strong> ${d.tooltipAmounts}`;
        });

      svg.call(tip);

      const symbol = d3.symbol().type(d3.symbolCross).size(25); // 设置符号为cross

      svg.append('g')
        .selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .attr("d", symbol) // 使用生成的cross符号
        .attr("transform", d => `translate(${x(new Date(d.originalDate))}, ${y(d.originalAmount)})`) // 定位交叉符号
        .style("fill", d => color(d.cluster))
        .style("opacity", 0.6)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

      svg.append("text")
        .attr("class", "text-style")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("K-means Clustering Result");

      // 增加边缘线
      svg.append("rect")
        .attr("class", "stroke-style")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "none")
        .attr("stroke-width", 1);

      // X 轴标题
      svg.append("text")
        .attr("class", "text-style")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom)
        .attr("font-size", "12px")
        .text("Time");

      // Y 轴标题
      svg.append("text")
        .attr("class", "text-style")
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 10)
        .attr("font-size", "12px")
        .text("Transaction Amount (unit: BGP)");

    };


    // const drawBarChart = (data, uniqueSubCategories) => {
    //   d3.select("#bar-chart").selectAll("*").remove();
    //
    //   const margin = { top: 90, right: 10, bottom: 40, left: 50 };
    //   const width = 500 - margin.left - margin.right;
    //   const height = 300 - margin.top - margin.bottom;
    //
    //   const svg = d3.select("#bar-chart")
    //     .append("svg")
    //     .attr("width", width + margin.left + margin.right)
    //     .attr("height", height + margin.top + margin.bottom)
    //     .append("g")
    //     .attr("transform", `translate(${margin.left},${margin.top})`);
    //
    //   const clusterGroups = d3.group(data, d => d.cluster);
    //
    //   const clusterCounts = Array.from(clusterGroups, ([cluster, points]) => {
    //     const subCategoryCounts = points.reduce((acc, point) => {
    //       const subCategory = point.originalSubCategory;
    //       acc[subCategory] = (acc[subCategory] || 0) + 1;
    //       return acc;
    //     }, {});
    //     return { cluster, subCategoryCounts };
    //   });
    //
    //   const x0 = d3.scaleBand()
    //     .domain(clusterCounts.map(d => d.cluster))
    //     .range([0, width])
    //     .paddingInner(0.1);
    //
    //   const x1 = d3.scaleBand()
    //     .domain(uniqueSubCategories)
    //     .range([0, x0.bandwidth()])
    //     .padding(0.05);
    //
    //   const y = d3.scaleLinear()
    //     .domain([0, d3.max(clusterCounts, d => d3.max(uniqueSubCategories, key => d.subCategoryCounts[key] || 0))])
    //     .range([height, 0]);
    //
    //   const color = d => colorMap[d] || '#ffffff';
    //
    //   const tip = d3Tip()
    //     .attr('class', 'd3-tip')
    //     .offset([-10, 0])
    //     .html(function(event, d) {
    //       return `<strong>SubCategory:</strong> ${d.key}<br><strong>Count:</strong> ${d.value}`;
    //     });
    //
    //   svg.call(tip);
    //
    //   svg.append("g")
    //     .selectAll("g")
    //     .data(clusterCounts)
    //     .enter()
    //     .append("g")
    //     .attr("transform", d => `translate(${x0(d.cluster)},0)`)
    //     .selectAll("rect")
    //     .data(d => uniqueSubCategories.map(key => ({ key, value: d.subCategoryCounts[key] || 0 })))
    //     .enter()
    //     .append("rect")
    //     .attr("x", d => x1(d.key))
    //     .attr("y", d => y(d.value))
    //     .attr("width", x1.bandwidth())
    //     .attr("height", d => height - y(d.value))
    //     .attr("fill", d => color(d.key))
    //     .on('mouseover', tip.show)
    //     .on('mouseout', tip.hide);
    //
    //   svg.append("g")
    //     .attr("class", "axis")
    //     .attr("transform", `translate(0,${height})`)
    //     .call(d3.axisBottom(x0).tickSize(0));
    //
    //   svg.append("g")
    //     .attr("class", "axis")
    //     .call(d3.axisLeft(y));
    //
    //   svg.append("text")
    //     .attr("class", "text-style")
    //     .attr("x", width / 2)
    //     .attr("y", -margin.top / 2 + 20)
    //     .attr("text-anchor", "middle")
    //     .style("font-size", "16px")
    //     .text("Clustered SubCategory Distribution");
    //
    //   svg.append("text")
    //     .attr("class", "text-style")
    //     .attr("x", width / 2)
    //     .attr("y", height + margin.bottom - 10)
    //     .attr("text-anchor", "middle")
    //     .style("font-size", "12px")
    //     .text("Cluster");
    //
    //   svg.append("text")
    //     .attr("class", "text-style")
    //     .attr("transform", "rotate(-90)")
    //     .attr("x", -height / 2)
    //     .attr("y", -margin.left + 10)
    //     .attr("text-anchor", "middle")
    //     .style("font-size", "12px")
    //     .text("SubCategory Count");
    // };


    const drawElbowChart = (elbowData) => {
      const margin = { top: 70, right: 10, bottom: 40, left: 65 };
      const width = 500 - margin.left - margin.right;
      const height = 330 - margin.top - margin.bottom;

      d3.select("#elbow-chart").selectAll("*").remove();

      const svg = d3.select("#elbow-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleLinear()
        .domain([1, d3.max(elbowData, d => d.k)])
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(elbowData, d => d.sse)])
        .range([height, 0]);

      // console.log('elbowData', elbowData);

      const line = d3.line()
        .x(d => x(d.k))
        .y(d => y(d.sse));
        // .curve(d3.curveMonotoneX);

      svg.append("path")
        .datum(elbowData)
        .attr("class", "line")
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2);

      // 添加散点
      svg.selectAll("dot")
        .data(elbowData)
        .enter()
        .append("circle")
        // .attr("class", "text-style")
        .attr("cx", d => x(d.k))
        .attr("cy", d => y(d.sse))
        .attr("r", 4)  // 圆点半径
        .attr("fill", "steelblue");

      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(10));

      svg.append("g")
        .call(d3.axisLeft(y).ticks(10));

      // x轴标题
      svg.append("text")
        .attr("class", "text-style")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("k");

      // y轴标题
      svg.append("text")
        .attr("class", "text-style")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("SSE");

      //图片标题
      svg.append("text")
        .attr("class", "text-style")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Elbow Method for Optimal K");
    };


    onMounted(() => {
      nextTick(() => {
        if (props.parsedData.length > 0) {
          openDrawer(); // 确保第一次加载时初始化数据
        }
      });
    });

    watch(() => props.isDarkMode, (newVal) => {
      setStyles(newVal);
      if (visible.value) {
        initializeDrawer(); // 更新可见drawer的内容
      }
    });


    return {
      visible,
      num,
      openDrawer,
      closeDrawer,
      selectedOption,
      initializeDrawer,
    };
  }
});
</script>

<style scoped>
.custom-input {
  width: 100px;
  margin-left: 20px;
}

#scatter-plot, #bar-chart, #elbow-chart {
  display: inline-block;
}

.drawer-box:deep(.el-drawer__body) {
  background-color: #141414;
  color: #ffffff; /* 默认的字体颜色 */
  box-shadow: -3px 0 5px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.kmeans-content {
  width: 100%;
  /*height: 100%;*/
  text-align: center;
}

.input-container {
  display: flex;
  align-items: center;
  margin-top: 20px;
}
</style>
