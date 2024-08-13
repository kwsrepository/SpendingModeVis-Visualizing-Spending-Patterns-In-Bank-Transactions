import * as d3 from 'd3';
import '@/assets/global.css';
import { segmentHeights, segments, segmentWidths, widthSegments, areaSizes, areaSegments } from '@/services/sizeMapping';

export function HeightLegendChart(containerSelector) {
  const width = 330;
  const height = 455; // 这个高度必须和映射高度区间的最大值完全一致
  const margin = { top: 40, right: 20, bottom: 60, left: 80 }; // 增加顶部和底部间距为轴标题留出空间

  // 创建 SVG 元素
  const svg = d3.select(containerSelector)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // 定义层数
  const numLayers = 5;
  const barsPerLayer = Math.ceil(segmentHeights.length / numLayers); // 每层的条形图数量

  // 将数据分层
  const layers = Array.from({ length: numLayers }, (_, layerIndex) => {
    return {
      heights: segmentHeights.slice(layerIndex * barsPerLayer, (layerIndex + 1) * barsPerLayer),
      segments: segments.slice(layerIndex * barsPerLayer, (layerIndex + 1) * barsPerLayer),
      indices: Array.from({ length: barsPerLayer }, (_, i) => i + 1)
    };
  });

  // 定义横轴和纵轴的比例尺
  const x = d3.scaleBand()
    .domain(layers[0].indices) // 使用索引作为分类
    .range([0, width])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(segmentHeights)])
    .range([height, 0]);

  // 创建横轴和纵轴
  const xAxis = d3.axisBottom(x)
    .tickFormat(() => "");  // 初始化时不显示任何文字

  const yAxis = d3.axisLeft(y);

  // 添加纵轴到 SVG
  svg.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

  // 添加 y 轴标题作为 SVG 的一部分
  svg.append("text")
    .attr("class", "y-axis-title")
    .attr("x", -margin.left / 2) // 使标题位于 y 轴上方居中
    .attr("y", -20) // 位置调整
    .style("text-anchor", "start")
    .style("font-size", "12px")
    .text("Mapping height (unit: px)");

  // 添加横轴到 SVG
  const xAxisGroup = svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);

  // 添加 x 轴标题作为 SVG 的一部分
  svg.append("text")
    .attr("class", "x-axis-title")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 20)
    .style("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Transaction amount (unit: BGP)");

  // 按从后到前的顺序绘制每层的条形图
  layers.reverse().forEach((layer, layerIndex) => {
    svg.selectAll(`.bar-layer-${layerIndex}`)
      .data(layer.heights)
      .enter()
      .append("rect")
      .attr("class", `bar-layer-${layerIndex}`)
      .attr("x", (d, i) => x(i + 1))  // 使用相同的 x 位置
      .attr("y", d => y(d))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d))
      .attr("fill", () => {
        switch (layerIndex) {
          // 注意是倒着画的，先画最后一层，最后画第1层
          case 0: return "#8F5E0D"; // 第5层颜色
          case 1: return "#B57F26"; // 第4层颜色
          case 2: return "#D39E47"; // 第3层颜色
          case 3: return "#F5C473"; // 第2层颜色
          case 4: return "#FFDCA3"; // 第1层颜色
          default: return "#cccccc"; // 默认颜色（不会用到）
        }
      })
      .attr("opacity", 1) // 适当设置透明度使其可见叠加效果
      .on("mouseover", function() {
        // 鼠标悬浮时降低其他层的透明度
        svg.selectAll("rect")
          .attr("opacity", 0);
        d3.selectAll(`.bar-layer-${layerIndex}`)
          .attr("opacity", 1); // 高亮当前层

        // 更新 X 轴的刻度显示为当前层对应的 segments
        xAxis.tickFormat((d, i) => {
          const segmentIndex = (numLayers - layerIndex - 1) * barsPerLayer + i;
          return segmentIndex < segments.length ? `${segments[segmentIndex]}` : '';
        });
        xAxisGroup.call(xAxis);
      })
      .on("mouseout", function() {
        // 鼠标移出时恢复所有层的透明度
        svg.selectAll("rect")
          .attr("opacity", 1);

        // 清除 X 轴的刻度显示
        xAxis.tickFormat(() => "");
        xAxisGroup.call(xAxis);
      });

    // 按相同的顺序为每个柱子添加文本
    svg.selectAll(`.label-layer-${layerIndex}`)
      .data(layer.heights)
      .enter()
      .append("text")
      .attr("class", `label-layer-${layerIndex}`)
      .attr("x", (d, i) => x(i + 1) + x.bandwidth() / 2)
      .attr("y", d => y(d) - 10)
      .attr("dy", ".75em")
      .text((d, i) => {
        const segmentIndex = (numLayers - layerIndex - 1) * barsPerLayer + i;
        return segmentIndex < segments.length ? segments[segmentIndex] : '';
      })
      .style("text-anchor", "middle")
      .style("font-size", "10px")
      .on("mouseover", function() {
        // 同步高亮文本所在的层
        svg.selectAll("rect")
          .attr("opacity", 0);
        d3.selectAll(`.bar-layer-${layerIndex}`)
          .attr("opacity", 1);

        // 更新 X 轴的刻度显示为当前层对应的 segments
        xAxis.tickFormat((d, i) => {
          const segmentIndex = (numLayers - layerIndex - 1) * barsPerLayer + i;
          return segmentIndex < segments.length ? `${segments[segmentIndex]}` : '';
        });
        xAxisGroup.call(xAxis);
      })
      .on("mouseout", function() {
        // 鼠标移出时恢复所有层的透明度
        svg.selectAll("rect")
          .attr("opacity", 1);

        // 清除 X 轴的刻度显示
        xAxis.tickFormat(() => "");
        xAxisGroup.call(xAxis);
      });
  });
}

export function WidthLegendChart(containerSelector) {
  const width = 230; // 这个宽度必须和映射宽度区间的最大值完全一致
  const height = 300;
  const margin = { top: 50, right: 20, bottom: 50, left: 70 };

  // 创建SVG元素
  const svg = d3.select(containerSelector)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // 定义层数
  const numLayers = 5;
  const barsPerLayer = Math.ceil(segmentWidths.length / numLayers); // 每层的条形图数量

  // 将数据分层
  const layers = Array.from({ length: numLayers }, (_, layerIndex) => {
    return {
      widths: segmentWidths.slice(layerIndex * barsPerLayer, (layerIndex + 1) * barsPerLayer),
      segments: widthSegments.slice(layerIndex * barsPerLayer, (layerIndex + 1) * barsPerLayer),
      indices: Array.from({ length: barsPerLayer }, (_, i) => i + 1)
    };
  });

  // 定义横轴和纵轴的比例尺
  const x = d3.scaleLinear()
    .domain([0, d3.max(segmentWidths)])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(layers[0].indices) // 使用索引作为分类
    .range([0, height])
    .padding(0.1);

  // 创建横轴和纵轴
  const xAxis = d3.axisBottom(x);
  const yAxis = d3.axisLeft(y)
    .tickFormat(() => ""); // 初始化时不显示任何文字

  // 添加横轴到 SVG
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);

  // 添加纵轴到 SVG
  const yAxisGroup = svg.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

  // 按从后到前的顺序绘制每层的条形图
  layers.reverse().forEach((layer, layerIndex) => {
    svg.selectAll(`.bar-layer-${layerIndex}`)
      .data(layer.widths)
      .enter()
      .append("rect")
      .attr("class", `bar-layer-${layerIndex}`)
      .attr("x", 0)
      .attr("y", (d, i) => y(i + 1))  // 使用相同的 y 位置
      .attr("width", d => x(d))
      .attr("height", y.bandwidth())
      .attr("fill", () => {
        switch (layerIndex) {
          // 注意是倒着画的，先画最后一层，最后画第1层
          case 0: return "#8F5E0D"; // 第5层颜色
          case 1: return "#B57F26"; // 第4层颜色
          case 2: return "#D39E47"; // 第3层颜色
          case 3: return "#F5C473"; // 第2层颜色
          case 4: return "#FFDCA3"; // 第1层颜色
          default: return "#cccccc"; // 默认颜色（不会用到）
        }
      })
      .attr("opacity", 1) // 适当设置透明度使其可见叠加效果
      .on("mouseover", function() {
        // 鼠标悬浮时降低其他层的透明度
        svg.selectAll("rect")
          .attr("opacity", 0);
        d3.selectAll(`.bar-layer-${layerIndex}`)
          .attr("opacity", 1); // 高亮当前层

        // 更新 Y 轴的刻度显示为当前层对应的 segments
        yAxis.tickFormat((d, i) => {
          const segmentIndex = (numLayers - layerIndex - 1) * barsPerLayer + i;
          return segmentIndex < widthSegments.length ? `${widthSegments[segmentIndex]}` : '';
        });
        yAxisGroup.call(yAxis);
      })
      .on("mouseout", function() {
        // 鼠标移出时恢复所有层的透明度
        svg.selectAll("rect")
          .attr("opacity", 1);

        // 清除 Y 轴的刻度显示
        yAxis.tickFormat(() => "");
        yAxisGroup.call(yAxis);
      });

    // 按相同的顺序为每个柱子添加文本
    svg.selectAll(`.label-layer-${layerIndex}`)
      .data(layer.widths)
      .enter()
      .append("text")
      .attr("class", `label-layer-${layerIndex}`)
      .attr("x", d => x(d) + 5) // 在条形图的末尾添加文本
      .attr("y", (d, i) => y(i + 1) + y.bandwidth() / 2)
      .attr("dy", ".35em")
      .text((d, i) => {
        const segmentIndex = (numLayers - layerIndex - 1) * barsPerLayer + i;
        return segmentIndex < widthSegments.length ? widthSegments[segmentIndex] : '';
      })
      .style("text-anchor", "start")
      .style("font-size", "10px")
      .on("mouseover", function() {
        // 同步高亮文本所在的层
        svg.selectAll("rect")
          .attr("opacity", 0);
        d3.selectAll(`.bar-layer-${layerIndex}`)
          .attr("opacity", 1);

        // 更新 Y 轴的刻度显示为当前层对应的 segments
        yAxis.tickFormat((d, i) => {
          const segmentIndex = (numLayers - layerIndex - 1) * barsPerLayer + i;
          return segmentIndex < widthSegments.length ? `${widthSegments[segmentIndex]}` : '';
        });
        yAxisGroup.call(yAxis);
      })
      .on("mouseout", function() {
        // 鼠标移出时恢复所有层的透明度
        svg.selectAll("rect")
          .attr("opacity", 1);

        // 清除 Y 轴的刻度显示
        yAxis.tickFormat(() => "");
        yAxisGroup.call(yAxis);
      });
  });

  // 添加X轴标题
  svg.append("text")
    .attr("class", "x-axis-title")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .style("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Mapping width (unit: px)");

  // 添加Y轴标题
  svg.append("text")
    .attr("class", "y-axis-title")
    .attr("x", -50)
    .attr("y", -margin.left / 2 + 15)
    .style("text-anchor", "letf")
    .style("font-size", "12px")
    .text("Transaction amount (unit: BGP)");
}

export function AreaLegendChart(containerSelector) {
  const width = 340; // 画布宽度
  const height = 400; // 画布高度
  const margin = { top: 40, right: 0, bottom: 50, left: 60 };

  // 创建 SVG 元素
  const svg = d3.select(containerSelector)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // 定义比例尺，直接映射像素值
  const x = d3.scaleLinear()
    .domain([0, width])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, height])
    .range([height, 0]);

  // 创建横轴和纵轴
  const xAxis = d3.axisBottom(x).ticks(5).tickFormat(d => `${d}`);
  const yAxis = d3.axisLeft(y).ticks(5).tickFormat(d => `${d}`);

  // 添加横轴到 SVG
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);

  // 添加 y 轴到 SVG
  svg.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

  // 添加 x 轴标题
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Width (px)");

  // 添加 y 轴标题
  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 20)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Height (px)");

  // 每三个面积中只展示第一个面积
  const filteredAreaSizes = areaSizes.filter((_, index) => index % 3 === 0);
  const filteredAreaSegments = areaSegments.filter((_, index) => index % 3 === 0);

  // 计算每个正方形的边长
  const squares = filteredAreaSizes.map((size, index) => ({
    size,
    segment: filteredAreaSegments[index],
    side: Math.sqrt(size)
  }));

  // 按面积从大到小排序正方形，以确保小方块在顶部
  squares.sort((a, b) => b.side - a.side);

  // 初始偏移量
  let xOffset = 0;
  let yOffset = 0;
  const padding = 20; // 方块之间的间距

  // 绘制正方形
  squares.forEach((square, index) => {
    // 计算方块的位置
    if (index > 0) {
      xOffset += padding;  // 右移
      yOffset += padding;  // 上移
    }

    // 确保不超过画布边界
    if (xOffset + square.side > width) {
      xOffset = 0;  // 如果超过宽度，则重置 x 偏移
      yOffset += padding + square.side;  // 新行
    }

    if (yOffset + square.side > height) {
      yOffset = 0;  // 如果超过高度，则重置 y 偏移
    }

    // 添加一个分组元素以包裹每个方块和其文字
    const group = svg.append("g")
      .attr("transform", `translate(${xOffset}, ${height - yOffset - square.side})`);

    // 绘制方块
    group.append("rect")
      .attr("width", square.side)
      .attr("height", square.side)
      .attr("fill", "#8F5E0D")
      .attr("opacity", 0.9)
      .on("mouseover", function () {
        // 鼠标悬浮时降低其他方块的透明度
        svg.selectAll("rect")
          .attr("opacity", 0.2);
        d3.select(this)
          .attr("opacity", 1); // 高亮当前方块

        // 显示文字
        group.select("text")
          .attr("opacity", 1);
      })
      .on("mouseout", function () {
        // 鼠标移出时恢复所有方块的透明度
        svg.selectAll("rect")
          .attr("opacity", 0.9);

        // 隐藏文字
        group.select("text")
          .attr("opacity", 0);
      });

    // 在方块中间添加文本，显示 areaSegments，初始状态设为隐藏
    group.append("text")
      .attr("x", square.side / 2)
      .attr("y", square.side / 2)
      .attr("dy", ".35em")
      .text(`Amount <= ${square.segment}`)
      .style("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "white")
      .attr("opacity", 0); // 默认隐藏文字
  });
}
