<template>
  <el-container>
    <el-header>
      <h1>Recreate Figure 1</h1>
    </el-header>
    <el-main>
      <div id="page1">
        <div id="chart"></div>
      </div>
    </el-main>
  </el-container>
</template>

<script>
import { onMounted } from 'vue';
import { StackBarChart } from '@/visualizations/stackBarChart';
import { loadData } from '@/services/DataService';
import '@/assets/global.css';
import { ElContainer, ElHeader, ElMain } from 'element-plus';

export default {
  name: 'Page1',
  components: {
    ElContainer,
    // ElAside,
    ElHeader,
    ElMain,
  },
  setup() {
    onMounted(async () => {
      const { jsonData } = await loadData();
      StackBarChart(jsonData);
    });
  }
};
</script>

<style scoped>

</style>
