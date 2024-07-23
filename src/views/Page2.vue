<template>
  <el-container direction="vertical">
    <el-main class="up-half-page">
      <el-tree
        ref="legendTree"
        class="custom-tree"
        :data="legendData"
        show-checkbox
        node-key="id"
        default-expand-all
        :props="defaultProps"
        @check="handleCheck"
        :render-content="renderContent"
      />
      <el-scrollbar ref="containerRef">
        <div id="event-sequence" style="overflow-y: auto;" @click="showDetail"></div>
      </el-scrollbar>
      <el-col :span="6">
        <el-anchor
          :container="containerRef"
          direction="vertical"
          type="default"
          :offset="30"
          @click="handleYearClick"
        >
          <template v-for="year in Object.keys(yearPositions).reverse()" :key="year">
            <el-anchor-link
              :href="`#year-${year}`"
              :title="`Year ${year}`"
            />
          </template>
        </el-anchor>
      </el-col>
    </el-main>
    <el-main class="down-half-page">
      <div id="user-option">
        <div>
          <el-button @click="selectAll">Select all</el-button>
        </div>
        <div>
          <el-button @click="clearAll">Clear</el-button>
        </div>
        <div>
          <el-switch
            v-model="showAllDates"
            class="ml-2"
            inline-prompt
            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
            active-text="Less Dates"
            inactive-text="All Dates"
          />
        </div>
        <div>
          <el-switch
            v-model="isDarkMode"
            class="ml-2"
            inline-prompt
            style="--el-switch-on-color: #606266; --el-switch-off-color: #DDDEE0"
            active-text="Dark"
            inactive-text="Light"
          >
            <template #active-action>
              <span class="custom-active-action">🌙</span>
            </template>
            <template #inactive-action>
              <span class="custom-inactive-action">☀️</span>
            </template>
          </el-switch>
        </div>
      </div>
      <div id="similar-list">
        <top-similar-list :topSimilarSequences="topSimilarSequences" />
      </div>
    </el-main>
    <transaction-similarity
      :visible="detailVisible"
      :details="selectedDetails"
      :dailySequences="dailySequences"
      @close="closeDetail"
      @update-top-similar-sequences="handleUpdateTopSimilarSequences"
    ></transaction-similarity>
  </el-container>
</template>

<script>
import { onMounted, ref, watch } from 'vue';
import { EventSequenceChart } from '@/visualizations/eventSequence';
import { loadData } from '@/services/DataService';
import { colorMap } from '@/services/colorMapping';
import TransactionSimilarity from '@/components/TransactionSimilarity';
import TopSimilarList from '@/components/topSimilarList.vue';
import '@/assets/global.css';
import { ElButton, ElSwitch, ElContainer, ElMain, ElTree, ElScrollbar, ElAnchor, ElAnchorLink, ElCol } from 'element-plus';

export default {
  name: 'Page2',
  components: {
    ElButton,
    ElSwitch,
    ElContainer,
    ElMain,
    ElTree,
    ElScrollbar,
    TransactionSimilarity,
    TopSimilarList,
    ElAnchor,
    ElAnchorLink,
    ElCol,
  },
  setup() {
    const showAllDates = ref(false);
    const isDarkMode = ref(false);
    let jsonData = ref([]);
    let worksheet = ref(null);
    const legendData = ref([
      {
        id: 1,
        label: 'Transaction Category',
        children: []
      }
    ]);
    const defaultProps = {
      children: 'children',
      label: 'label'
    };

    const selectedCategories = ref(new Set());
    const selectedKeys = ref([]);
    const legendTree = ref(null);
    const containerRef = ref(null);

    const detailVisible = ref(false);
    const selectedDetails = ref('');
    const dailySequences = ref({});
    const topSimilarSequences = ref([]);
    const yearPositions = ref({});

    const fetchData = async (showAllDatesValue) => {
      const data = await loadData();
      jsonData.value = data.jsonData;
      worksheet.value = data.worksheet;
      const result = EventSequenceChart(jsonData.value, worksheet.value, showAllDatesValue, selectedCategories.value);
      dailySequences.value = result.dailySequences;

      yearPositions.value = Object.fromEntries(
        Object.entries(result.yearPositions).sort((a, b) => b[0] - a[0])
      );

      populateLegendData();
    };

    const handleUpdateTopSimilarSequences = (newTopSimilarSequences) => {
      topSimilarSequences.value = newTopSimilarSequences;
      // console.log('Top Similar Sequences:', topSimilarSequences.value);
    };

    const categoryMapping = {
      'Daily expenses and consumption': 'Daily expenses & consumption',
      'Financial management and transfers': 'Financial management & transfers',
      'Housing and facilities': 'Housing & facilities',
      'Income and investments': 'Income & investments',
      'Insurance and Health': 'Insurance & Health',
    };

    const populateLegendData = () => {
      const categories = [ ...Array.from(new Set(jsonData.value.map(d => d.Category ? d.Category.trim() : 'Null').filter(c => c !== 'Null'))).sort((a, b) => a.localeCompare(b))];

      legendData.value[0].children = categories.map(category => ({
        id: category,
        label: categoryMapping[category] || category,
        children: jsonData.value
          .filter(d => d.Category === category)
          .map(d => d.subCategory ? d.subCategory.trim() : 'Null')
          .filter((value, index, self) => self.indexOf(value) === index)
          .map(subCategory => ({
            id: `${category}-${subCategory}`,
            label: subCategory,
            color: colorMap[subCategory] || 'transparent'
          }))
      }));
    };

    const handleCheck = (node, { checkedNodes, checkedKeys }) => {
      selectedKeys.value = checkedKeys; // 保存当前选中的键值
      const selected = new Set(checkedNodes.filter(node => node.children == null).map(node => node.label));
      selectedCategories.value = selected;
      EventSequenceChart(jsonData.value, worksheet.value, showAllDates.value, selectedCategories.value);
    };

    const showDetail = (event) => {
      if (event.target.classList.contains('event-rect')) {
        const transactionDate = event.target.__data__.date;
        selectedDetails.value = `Date: ${transactionDate}, Category : ${event.target.__data__.category} , ${event.target.__data__.subCategory}`;
        detailVisible.value = true;
      }
    };

    const closeDetail = () => {
      detailVisible.value = false;
    };

    onMounted(() => {
      fetchData(showAllDates.value).then(() => {
        const allKeys = legendData.value[0].children.flatMap(child => child.children.map(subChild => subChild.id));
        const allLabels = legendData.value[0].children.flatMap(child => child.children.map(subChild => subChild.label));

        legendTree.value.setCheckedKeys(allKeys);
        selectedCategories.value = new Set(allLabels);
        selectedKeys.value = allKeys; // 初始状态下保存所有键值

        const result = EventSequenceChart(jsonData.value, worksheet.value, showAllDates.value, selectedCategories.value);
        dailySequences.value = result.dailySequences;
        yearPositions.value = result.yearPositions;
        console.log("dailySequences in onMounted:", dailySequences.value); // 添加此行进行调试
      });
    });


    const renderContent = (h, { node, data }) => {
      return h('span', [
        h('span', {
          style: { backgroundColor: data.color || 'transparent', marginRight: '5px', width: '14px', height: '14px', display: 'inline-block', borderRadius: '50%' }
        }),
        h('span', { class: 'tree-node-text' }, node.label)
      ]);
    };

    watch(showAllDates, (newVal) => {
      fetchData(newVal).then(() => {
        legendTree.value.setCheckedKeys(selectedKeys.value); // 恢复之前的选中状态
        EventSequenceChart(jsonData.value, worksheet.value, showAllDates.value, selectedCategories.value);
      });
    });

    watch(isDarkMode, (newVal) => {
      const root = document.documentElement;
      if (newVal) { //黑夜模式
        root.style.setProperty('--text-color', '#CFD3DC');
        root.style.setProperty('--bg-color', '#141414');
        root.style.setProperty('--scrollbar-color', '#A3A6AD');
        root.style.setProperty('--scrollbar-hover-color', '#E5EAF3');
        root.style.setProperty('--month-header-color', '#555555');
      } else {  //白天模式
        root.style.setProperty('--text-color', '#606266');
        root.style.setProperty('--bg-color', '#ffffff');
        root.style.setProperty('--scrollbar-color', '#CDCDCD');
        root.style.setProperty('--scrollbar-hover-color', '#C7C9CC');
        root.style.setProperty('--month-header-color', '#F5F7FA');
      }
    });

    const selectAll = () => {
      const allKeys = legendData.value[0].children.flatMap(child => child.children.map(subChild => subChild.id));
      selectedCategories.value = new Set(legendData.value[0].children.flatMap(child => child.children.map(subChild => subChild.label)));
      legendTree.value.setCheckedKeys(allKeys);
      selectedKeys.value = allKeys; // 更新所有选中的键值
      EventSequenceChart(jsonData.value, worksheet.value, showAllDates.value, selectedCategories.value);
    };

    const clearAll = () => {
      selectedCategories.value = new Set();
      legendTree.value.setCheckedKeys([]);
      selectedKeys.value = []; // 清空选中的键值
      EventSequenceChart(jsonData.value, worksheet.value, showAllDates.value, selectedCategories.value);
    };

    const handleYearClick = (event) => {
      event.preventDefault();
      const target = event.target;
      const href = target.getAttribute('href');
      if (href && containerRef.value) {
        const year = href.replace('#year-', '');
        const position = yearPositions.value[year];
        if (position !== undefined) {
          containerRef.value.scrollTo({ top: position, behavior: 'smooth' });
        }
      }
    };
console.log("dailySequences1:", dailySequences)
    return {
      showAllDates,
      isDarkMode,
      selectAll,
      clearAll,
      legendData,
      defaultProps,
      handleCheck,
      legendTree,
      renderContent,
      dailySequences,
      fetchData,
      detailVisible,
      selectedDetails,
      showDetail,
      closeDetail,
      handleUpdateTopSimilarSequences,
      topSimilarSequences,
      yearPositions,
      containerRef,
      handleYearClick
    };
  }
};
</script>

<style scoped>
.custom-tree {
  max-width: 600px;
  height: 100%;
  overflow-y: auto;
  width: 300px;
  padding-right: 30px;
  border-right: 2px solid #E4E4E4;
  background-color: inherit;  /* 继承父容器的背景色 */
}

.custom-tree >>> .el-tree-node__content {
  height: 16px; /* 每个树节点内容的高度 */
}

#user-option{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  height: 100%;
  margin-left: 10px;
  margin-right: 10px;
}

.up-half-page {
  height: 65%;
}

.down-half-page {
  height: 35%;
  border: 2px solid #E4E4E4;
  border-radius: 8px;
  display: flex;
}

.up-half-page, .down-half-page{
  width: 100%;
  display: flex;
  justify-content: left;
  padding: 10px;
}

.el-switch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 25px;
}

.el-switch >>> .el-switch__core {
  height: 100% !important; /* 强制设置开关核心的高度 */
  width: 100% !important; /* 强制设置开关核心的宽度 */
  border-radius: 20px;
}
</style>

