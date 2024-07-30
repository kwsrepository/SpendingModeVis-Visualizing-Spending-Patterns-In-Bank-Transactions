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
            active-text="All Dates"
            inactive-text="Less Dates"
          />
        </div>
        <div>
          <el-switch
            v-model="isDarkMode"
            class="ml-2"
            inline-prompt
            style="--el-switch-on-color: #DDDEE0; --el-switch-off-color: #606266"
            active-text="Light"
            inactive-text="Dark"
          >
            <template #active-action>
              <span class="custom-inactive-action">☀️</span>
            </template>
            <template #inactive-action>
              <span class="custom-active-action">🌙</span>
            </template>
          </el-switch>
          <div class="select_box">
            <el-select v-model="selectedAlgorithm" placeholder="Select Algorithm">
              <el-option label="Levenshtein" value="levenshtein"></el-option>
              <el-option label="Damerau-Levenshtein" value="damerau-levenshtein"></el-option>
              <el-option label="Hamming" value="hamming"></el-option>
              <el-option label="Jaro-Winkler" value="jaro-winkler"></el-option>
            </el-select>
          </div>
          <div class="select_box">
            <el-select v-model="selectedMapping" placeholder="Select Mapping">
              <el-option label="Do Not Map" :value="'none'"></el-option>
              <el-option label="Map Height" :value="'height'"></el-option>
              <el-option label="Map Width" :value="'width'"></el-option>
              <el-option label="Map to Area" value="area"></el-option>
            </el-select>
          </div>
        </div>
      </div>
      <div id="similar-list">
        <top-similar-list
          :topSimilarSequences="topSimilarSequences"
          :selectedDetails="selectedDetails"
          :listAmounts="listAmounts"
          @select-similar-sequence="handleSelectSimilarSequence"
        />
      </div>
      <div id="algorithm-details">
        <div id="algorithm-description" v-html="selectedDescription"></div>
        <div id="algorithm-process">
          <algorithm-process :details="selectedDetails" :similarDetails="selectedSimilarDetails"></algorithm-process>
        </div>
      </div>
    </el-main>
    <transaction-similarity
      :visible="detailVisible"
      :details="selectedDetails"
      :dailySequences="dailySequences"
      :algorithm="selectedAlgorithm"
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
import { findTopSimilarSequences } from '@/services/sequenceSimilarity';
import TopSimilarList from '@/components/topSimilarList.vue';
import AlgorithmProcess from '@/components/AlgorithmProcess.vue';
import '@/assets/global.css';
import { ElButton, ElSwitch, ElContainer, ElMain, ElTree, ElScrollbar, ElAnchor, ElAnchorLink, ElCol, ElSelect, ElOption } from 'element-plus';

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
    AlgorithmProcess,
    ElAnchor,
    ElAnchorLink,
    ElCol,
    ElSelect,
    ElOption,
  },
  setup() {
    const showAllDates = ref(false);
    const isDarkMode = ref(false);
    const selectedAlgorithm = ref('levenshtein');
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
    const selectedMapping = ref('none');

    const detailVisible = ref(false);
    const selectedDetails = ref({
      date: '',
      category: '',
      subCategory: '',
      debitAmount: '',
      creditAmount: '',
      sequence: '',
    });
    const selectedSimilarDetails = ref({
      date: '',
      sequence: '',
      debitAmounts: [],
      creditAmounts: []
    });
    const dailySequences = ref({});
    const dailyAmounts = ref({});
    const topSimilarSequences = ref([]);
    const listAmounts = ref({});
    const yearPositions = ref({});

    const algorithmDescriptions = {
      'levenshtein': '<strong>Levenshtein Distance</strong>: Measures how many single-character edits (<span class = "key-words">insertions</span>, <span class = "key-words">deletions</span>, or <span class = "key-words">substitutions</span>) are needed to change one string into another.',
      'damerau-levenshtein': '<strong>Damerau-Levenshtein Distance</strong>: Measures the number of single-character edits (<span class = "key-words">insertions</span>, <span class = "key-words">deletions</span>, <span class = "key-words">substitutions</span>, or <span class = "key-words">transpositions of two adjacent characters</span>) needed to change one string into another',
      'hamming': '<strong>Hamming Distance</strong>: Counts the number of positions at which two strings of <span class = "key-words">equal length</span> have different characters.',
      'jaro-winkler': '<strong>Jaro-Winkler Distance</strong>: Measures the similarity between two strings based on the <span class = "key-words">number and order</span> of matching characters. <span class = "key-words">Common prefixes</span> increase the similarity score.'
    };

    const selectedDescription = ref(algorithmDescriptions[selectedAlgorithm.value]);

    watch(selectedAlgorithm, (newAlgorithm) => {
      selectedDescription.value = algorithmDescriptions[newAlgorithm];
      // console.log('algorithmDescriptions:', selectedDescription.value);

      // 每次用户切换算法时，清空之前选择的相似序列
      selectedSimilarDetails.value = null;
    });

    const fetchData = async (showAllDatesValue) => {
      const selectedKeysBackup = [...selectedKeys.value]; // 备份选中状态
      const data = await loadData();
      jsonData.value = data.jsonData;
      worksheet.value = data.worksheet;
      const result = EventSequenceChart(jsonData.value, worksheet.value, showAllDatesValue, selectedCategories.value, selectedMapping.value);
      dailySequences.value = result.dailySequences;
      dailyAmounts.value = result.dailyAmounts;
      // console.log("dailyAmounts:", dailyAmounts);

      yearPositions.value = Object.fromEntries(
        Object.entries(result.yearPositions).sort((a, b) => b[0] - a[0])
      );

      populateLegendData();
      legendTree.value.setCheckedKeys(selectedKeysBackup); // 恢复选中状态
    };

    const updateTopSimilarSequences = () => {
      if (selectedDetails.value && selectedDetails.value.date && selectedDetails.value.sequence) {
        const selectedSequenceDate = selectedDetails.value.date;
        const selectedSequence = selectedDetails.value.sequence;

        // console.log("Selected Date:", selectedSequenceDate);
        // console.log("Selected Sequence:", selectedSequence);

        if (selectedSequence) {
          const targetSequence = { date: selectedSequenceDate, sequence: selectedSequence };
          const allSequences = Object.keys(dailySequences.value)
            .filter(date => date !== selectedSequenceDate) // 排除所选序列的日期
            .map(date => ({
              date,
              sequence: dailySequences.value[date]
            }));

          // console.log("All Sequences for Comparison:", allSequences);

          topSimilarSequences.value = findTopSimilarSequences(targetSequence, allSequences, selectedAlgorithm.value);
          // console.log("Top Similar Sequences:", topSimilarSequences.value);
          // 这里取到的topSimilarSequences不是真的最相似序列list的信息，只是取了数据集中最晚的10个日期
          // 在后面的handleUpdateTopSimilarSequences中才取到了真正的topSimilarSequences
        }
      } else {
        console.error("Selected Details do not have the expected structure:", selectedDetails.value);
      }
    };

    watch(selectedDetails, () => {
      console.log("selectedDetails changed:", selectedDetails.value);
      updateTopSimilarSequences();
    });

    const handleUpdateTopSimilarSequences = (newTopSimilarSequences) => {
      topSimilarSequences.value = newTopSimilarSequences;
      // console.log('Top Similar Sequences:', topSimilarSequences.value);
      // 这里取到的topSimilarSequences才是真正最相似序列list的信息，已经经过排序过滤
    };

    watch(topSimilarSequences, (newVal) => {
      if (newVal && dailyAmounts.value) {
        const newListAmounts = {};
        newVal.forEach(seq => {
          if (dailyAmounts.value[seq.date]) {
            newListAmounts[seq.date] = {
              debitAmounts: dailyAmounts.value[seq.date].debitAmounts,
              creditAmounts: dailyAmounts.value[seq.date].creditAmounts
            };
          }
        });
        listAmounts.value = newListAmounts;
        // console.log("listAmounts:", listAmounts.value);
      }
    });

    const handleSelectSimilarSequence = (sequenceDetails) => {
      selectedSimilarDetails.value = sequenceDetails;
      console.log("selectedSimilarDetails:", selectedSimilarDetails.value);
    };

    const categoryMapping = {
      'Daily expenses and consumption': 'Daily expenses & consumption',
      'Financial management and transfers': 'Financial management & transfers',
      'Housing and facilities': 'Housing & facilities',
      'Income and investments': 'Income & investments',
      'Insurance and Health': 'Insurance & Health',
    };

    const populateLegendData = () => {
      const categories = [...Array.from(new Set(jsonData.value.map(d => d.Category ? d.Category.trim() : 'Null').filter(c => c !== 'Null'))).sort((a, b) => a.localeCompare(b))];

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
      selectedKeys.value = checkedKeys;
      const selected = new Set(checkedNodes.filter(node => node.children == null).map(node => node.label));
      selectedCategories.value = selected;
      legendTree.value.setCheckedKeys(selectedKeys.value); // 恢复之前的选中状态
      EventSequenceChart(jsonData.value, worksheet.value, showAllDates.value, selectedCategories.value, selectedMapping.value);
    };

    const showDetail = (event) => {
      if (event.target.classList.contains('event-rect')) {
        const transactionDate = event.target.__data__.date;
        const category = event.target.__data__.category;
        const subCategory = event.target.__data__.subCategory;
        const debitAmount = event.target.__data__.debitAmount;
        const creditAmount = event.target.__data__.creditAmount;
        const sequence = dailySequences.value[transactionDate];

        selectedDetails.value = {
          date: transactionDate,
          category: category,
          subCategory: subCategory,
          debitAmount: debitAmount,
          creditAmount: creditAmount,
          sequence: sequence,
          debitAmounts: dailyAmounts.value[transactionDate].debitAmounts,
          creditAmounts: dailyAmounts.value[transactionDate].creditAmounts
        };

        detailVisible.value = true;
      }
    };

    const closeDetail = () => {
      detailVisible.value = false;
    };

    watch(selectedMapping, () => {
      fetchData(showAllDates.value).then(() => {
        legendTree.value.setCheckedKeys(selectedKeys.value); // 恢复之前的选中状态
      });
    });

    onMounted(() => {
      fetchData(showAllDates.value).then(() => {
        const allKeys = legendData.value[0].children.flatMap(child => child.children.map(subChild => subChild.id));
        const allLabels = legendData.value[0].children.flatMap(child => child.children.map(subChild => subChild.label));

        legendTree.value.setCheckedKeys(allKeys);
        selectedCategories.value = new Set(allLabels);
        selectedKeys.value = allKeys; // 初始状态下保存所有键值

        legendTree.value.setCheckedKeys(selectedKeys.value); // 恢复之前的选中状态
        const result = EventSequenceChart(jsonData.value, worksheet.value, showAllDates.value, selectedCategories.value, selectedMapping.value);
        dailySequences.value = result.dailySequences;
        yearPositions.value = result.yearPositions;
        // console.log("dailySequences in onMounted:", dailySequences.value);
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
        EventSequenceChart(jsonData.value, worksheet.value, showAllDates.value, selectedCategories.value, selectedMapping.value);
      });
    });

    watch(selectedAlgorithm, () => {
      if (detailVisible.value) {
        updateTopSimilarSequences();
      }
    });

    watch(isDarkMode, (newVal) => {
      const root = document.documentElement;
      if (newVal) { //白天模式
        root.style.setProperty('--text-color', '#606266');
        root.style.setProperty('--bg-color', '#ffffff');
        root.style.setProperty('--scrollbar-color', '#CDCDCD');
        root.style.setProperty('--scrollbar-hover-color', '#C7C9CC');
        root.style.setProperty('--month-header-color', '#F5F7FA');
      } else {  //黑夜模式
        root.style.setProperty('--text-color', '#CFD3DC');
        root.style.setProperty('--bg-color', '#141414');
        root.style.setProperty('--scrollbar-color', '#A3A6AD');
        root.style.setProperty('--scrollbar-hover-color', '#E5EAF3');
        root.style.setProperty('--month-header-color', '#555555');
      }
    });

    const selectAll = () => {
      const allKeys = legendData.value[0].children.flatMap(child => child.children.map(subChild => subChild.id));
      selectedCategories.value = new Set(legendData.value[0].children.flatMap(child => child.children.map(subChild => subChild.label)));
      legendTree.value.setCheckedKeys(allKeys);
      selectedKeys.value = allKeys; // 更新所有选中的键值
      EventSequenceChart(jsonData.value, worksheet.value, showAllDates.value, selectedCategories.value, selectedMapping.value);
    };

    const clearAll = () => {
      selectedCategories.value = new Set();
      legendTree.value.setCheckedKeys([]);
      selectedKeys.value = []; // 清空选中的键值
      EventSequenceChart(jsonData.value, worksheet.value, showAllDates.value, selectedCategories.value, selectedMapping.value);
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
    // console.log("dailySequences2:", dailySequences);
    // console.log("dailyAmounts:", dailyAmounts);

    return {
      showAllDates,
      isDarkMode,
      selectedAlgorithm,
      selectedMapping,
      updateTopSimilarSequences,
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
      handleYearClick,
      selectedDescription,
      dailyAmounts,
      listAmounts,
      selectedSimilarDetails,
      handleSelectSimilarSequence
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
  height: 100% !important;
  width: 100% !important;
  border-radius: 20px;
}

.select_box {
  margin-top: 10px;
}
</style>

