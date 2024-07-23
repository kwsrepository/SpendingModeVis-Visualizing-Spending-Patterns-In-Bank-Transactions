<template>
  <el-container>
    <el-header>
      <h1>color map design</h1>
    </el-header>
    <el-main>
      <div id="colormap-container">
        <canvas id="colormap-canvas"></canvas>
      </div>
      <div id="category-colors">
        <ul>
          <li v-for="(color, index) in categoryColors" :key="index">
            <span :style="{ backgroundColor: color }" class="color-box"></span>
            {{ categories[index] }}: {{ color }}
          </li>
        </ul>
      </div>
    </el-main>
  </el-container>
</template>

<script>
import '@/assets/global.css';
// import { jetColormap } from '@/services/colorMapping';
import { extractColors } from '@/services/extractColors';
import { ElContainer, ElHeader, ElMain } from 'element-plus';

export default {
  name: 'Page3',
  components: {
    ElContainer,
    // ElAside,
    ElHeader,
    ElMain,
  },
  data() {
    return {
      categories: ['Income and investments', 'Daily expenses and consumption', 'Housing and facilities',
        'Insurance and Health', 'Financial management and transfers', 'Other miscellaneous'],
      categoryColors: [],
      colorPositions: []
    };
  },
  mounted() {
    const imageSrc = '/colormap_hsv_trimmed.png';
    const numColors = this.categories.length;

    extractColors(imageSrc, numColors, (colors, positions) => {
      this.categoryColors = colors;
      this.colorPositions = positions;
      this.drawImageWithMarkers(imageSrc, positions);
    });
  },
  methods: {
    drawImageWithMarkers(imageSrc, positions) {
      const canvas = document.getElementById('colormap-canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = imageSrc;
      img.crossOrigin = 'Anonymous'; // 为了处理跨域问题

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // 画圈标记位置
        ctx.fillStyle = 'white';
        positions.forEach(pos => {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 6, 0, 2 * Math.PI);
          ctx.fill();
        });
      };
    }
  }
};
</script>

<style scoped>
#colormap-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

#category-colors {
  margin-top: 20px;
}

.color-box {
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-right: 10px;
  border: 1px solid #000;
}
</style>
