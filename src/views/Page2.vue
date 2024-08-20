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
        <div class="switch-fixed">
          <el-switch
            v-model="showAllDates"
            class="ml-2"
            inline-prompt
            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
            active-text="All Dates"
            inactive-text="Less Dates"
          />
          <div class="radio-container">
            <el-radio-group v-model="selectedMapping" class="radio-group-vertical">
              <el-radio value="none">No Amount Mapping</el-radio>
              <el-radio value="height">Amount Map to Height</el-radio>
              <el-radio value="width">Amount Map to Width</el-radio>
              <el-radio value="area">Amount Map to Area</el-radio>
            </el-radio-group>
          </div>
          <el-dropdown @command="handleDropdownCommand" style="margin-top: 10px">
            <span class="el-dropdown-link">
              Find Average Day
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="mostFrequent">Most frequent day</el-dropdown-item>
                <el-dropdown-item command="averageDay">Average day info</el-dropdown-item>
                <el-dropdown-item command="categoryDistribution">Category distribution</el-dropdown-item>
                <el-dropdown-item command="amountDistribution">Amount distribution</el-dropdown-item>
                <el-dropdown-item command="timeDistribution">Time distribution</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-scrollbar>
      <div style="width: 100px;">
        <el-col :span="6">
          <el-anchor
            :container="containerRef"
            direction="vertical"
            type="default"
            :offset="30"
            @click="handleYearClick"
            style="width: 100px;"
          >
            <template v-for="year in Object.keys(yearPositions).reverse()" :key="year">
              <el-anchor-link
                :href="`#year-${year}`"
                :title="`Year ${year}`"
              />
            </template>
          </el-anchor>
        </el-col>
      </div>
      <div v-if="showMappingLegend" class="mapping-legend"></div>
      <div v-else class="average-info">
        <div v-if="selectedDropdown === 'mostFrequent'" class="new-content-container">
          <div id="algorithm-process">
            <algorithm-process
              :details="selectedDetails"
              :similarDetails="selectedSimilarDetails"
              :dailySequences="dailySequences"
              :dailyAmounts="dailyAmounts"
              :selectedMapping="selectedMapping"
            />
          </div>
        </div>
        <div v-if="selectedDropdown === 'averageDay'" class="new-content-container">
          <AverageDay :parsedData="parsedData" />
        </div>
        <div v-if="selectedDropdown === 'categoryDistribution' && jsonData && worksheet" class="new-content-container">
          <CategoryDistribution :data="jsonData" />
        </div>
        <div v-if="selectedDropdown === 'amountDistribution' && jsonData && worksheet" class="new-content-container">
          <AmountDistribution :data="jsonData" />
        </div>
        <div v-if="selectedDropdown === 'timeDistribution' && jsonData && worksheet" class="new-content-container">
          <TimeDistribution
            :parsedData="parsedData"
            :selectedCategories="selectedCategories"
          />
        </div>
      </div>
    </el-main>

    <el-main class="down-half-page">
      <div id="user-option">
        <!--        <div>-->
        <!--          <el-button @click="selectAll">Select all</el-button>-->
        <!--        </div>-->
        <!--        <div>-->
        <!--          <el-button @click="clearAll">Clear</el-button>-->
        <!--        </div>-->
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
        </div>
        <div class="radio-group">
          <el-radio-group v-model="selectedOption" class="radio-group-vertical">
            <el-radio value="category">Category Similarity</el-radio>
            <el-radio value="amount">Amount Similarity</el-radio>
            <el-radio value="combined">Category & Amount Similarity</el-radio>
          </el-radio-group>
        </div>
        <div class="algorithm_box">
          <el-select
            v-model="selectedAlgorithm"
            placeholder="Select Algorithm"
            :disabled="selectedOption == 'amount'"
          >
            <el-option label="Levenshtein" value="levenshtein"></el-option>
            <el-option label="Damerau-Levenshtein" value="damerau-levenshtein"></el-option>
            <el-option label="Hamming" value="hamming"></el-option>
            <el-option label="Jaro-Winkler" value="jaro-winkler"></el-option>
          </el-select>
        </div>
        <div style="margin-top: 10px">
          <el-button @click="toggleTransactionDetail" style="width: 100px;">Calendar</el-button>
        </div>
        <el-button @click="openKMeansDrawer" style="width: 100px;">Cluster</el-button>
        <k-means
          :parsedData="parsedData"
          :isDarkMode="isDarkMode"
          ref="kmeansComponent"
        />
      </div>
      <div id="similar-list">
        <top-similar-list
          :topSimilarSequences="topSimilarSequences"
          :selectedDetails="selectedDetails"
          :listAmounts="listAmounts"
          :selectedMapping="selectedMapping"
          :selectedOption="selectedOption"
          @select-similar-sequence="handleSelectSimilarSequence"
        />
      </div>
      <div id="algorithm-details">
        <div id="algorithm-description" v-html="selectedDescription" v-if="selectedOption === 'category'"></div>
      </div>
    </el-main>
    <transaction-similarity
      :visible="showTransactionDetail"
      :details="selectedDetails"
      :dailySequences="dailySequences"
      :dailyAmounts="dailyAmounts"
      :algorithm="selectedAlgorithm"
      :selectedOption="selectedOption"
      @close="closeDetail"
      @update-top-similar-sequences="handleUpdateTopSimilarSequences"
    ></transaction-similarity>
  </el-container>
</template>

<script>
import * as d3 from 'd3';
import { onMounted, ref, watch } from 'vue';
import { EventSequenceChart } from '@/visualizations/eventSequence';
import { HeightLegendChart, WidthLegendChart, AreaLegendChart } from '@/visualizations/mappingLegend';
import { loadData } from '@/services/DataService';
import { colorMap } from '@/services/colorMapping';
import TransactionSimilarity from '@/components/TransactionSimilarity';
import KMeans from '@/components/KMeans.vue';
import { findTopSimilarSequences, findTopSimilarSequencesByAmount, findTopSimilarSequencesCombined } from '@/services/sequenceSimilarity';
import TopSimilarList from '@/components/topSimilarList.vue';
import AlgorithmProcess from '@/components/AlgorithmProcess.vue';
import CategoryDistribution from '@/components/CategoryDistribution.vue';
import AmountDistribution from '@/components/AmountDistribution.vue';
import TimeDistribution from '@/components/TimeDistribution.vue';
import AverageDay from '@/components/AverageDay.vue';
import '@/assets/global.css';
import { ElSwitch, ElButton, ElContainer, ElMain, ElTree, ElScrollbar, ElAnchor, ElAnchorLink,
  ElCol, ElSelect, ElOption, ElRadioGroup, ElRadio,
  ElDropdown, ElDropdownMenu, ElDropdownItem, ElIcon } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';


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
    KMeans,
    TopSimilarList,
    AlgorithmProcess,
    CategoryDistribution,
    AmountDistribution,
    TimeDistribution,
    AverageDay,
    ElAnchor,
    ElAnchorLink,
    ElCol,
    ElSelect,
    ElOption,
    ElRadioGroup,
    ElRadio,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElIcon,
    ArrowDown,
  },
  watch: {
    selectedMapping() {
      this.showMappingLegend = true;  // 切换到 mapping-legend
    },
    selectedDropdown() {
      this.showMappingLegend = false; // 切换到 average-info
    }
  },
  methods: {
    toggleTransactionDetail() {
      this.showTransactionDetail = !this.showTransactionDetail;
    },
    openKMeansDrawer() {
      this.$nextTick(() => {
        if (this.$refs.kmeansComponent) {
          this.$refs.kmeansComponent.openDrawer();
        } else {
          console.error("KMeans component is not loaded or ref is not set correctly.");
        }
      });
    },
    closeDetail() {
      this.showTransactionDetail = false;
    },
    handleDropdownCommand(command) {
      this.selectedDropdown = command; // 处理下拉菜单选择
    },
  },
  setup() {
    const showAllDates = ref(false);
    const isDarkMode = ref(false);
    const selectedAlgorithm = ref('levenshtein');
    let jsonData = ref([]);
    let worksheet = ref(null);
    const parsedData = ref([]);
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
    const showTransactionDetail = ref(false);
    const selectedDropdown = ref(null);
    const showMappingLegend = ref(true);

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
    const selectedOption = ref('category');

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
      parsedData.value = result.parsedData;
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
          const targetSequence = {
            date: selectedSequenceDate,
            sequence: selectedSequence,
            debitAmounts: dailyAmounts.value[selectedSequenceDate].debitAmounts,
            creditAmounts: dailyAmounts.value[selectedSequenceDate].creditAmounts
          };

          const allSequences = Object.keys(dailySequences.value)
            .filter(date => date !== selectedSequenceDate) // 排除所选序列的日期
            .map(date => ({
              date,
              sequence: dailySequences.value[date],
              debitAmounts: dailyAmounts.value[date].debitAmounts,
              creditAmounts: dailyAmounts.value[date].creditAmounts
            }));

          // console.log("All Sequences for Comparison:", allSequences);

          if (selectedOption.value === 'category') {
            topSimilarSequences.value = findTopSimilarSequences(targetSequence, allSequences, selectedAlgorithm.value);
            // console.log("Top Similar Sequences:", topSimilarSequences.value);
            // 这里取到的topSimilarSequences不是真的最相似序列list的信息，只是取了数据集中最晚的10个日期
            // 在后面的handleUpdateTopSimilarSequences中才取到了真正的topSimilarSequences
          } else if (selectedOption.value === 'amount') {
            topSimilarSequences.value = findTopSimilarSequencesByAmount(targetSequence, allSequences);
          } else if (selectedOption.value === 'combined') {
            topSimilarSequences.value = findTopSimilarSequencesCombined(targetSequence, allSequences, selectedAlgorithm.value);
          }

          // console.log("Top Similar Sequences:", topSimilarSequences.value);
        }
      } else {
        console.error("Selected Details do not have the expected structure:", selectedDetails.value);
      }
    };

    watch(selectedOption, () => {
      if (selectedDetails.value && selectedDetails.value.date && selectedDetails.value.sequence) {
        updateTopSimilarSequences();
        // console.log('Top Similar Sequences:', topSimilarSequences.value);
      }
    });

    watch(selectedDetails, () => {
      // console.log("selectedDetails changed:", selectedDetails.value);
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
      // console.log("selectedSimilarDetails:", selectedSimilarDetails.value);
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
      // console.log('selectedCategories', selectedCategories.value);

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

    watch(selectedMapping, (newMapping) => {
      fetchData(showAllDates.value).then(() => {
        legendTree.value.setCheckedKeys(selectedKeys.value); // 恢复之前的选中状态

        // 清空旧图例
        d3.select('.mapping-legend').selectAll('*').remove();

        if (newMapping === 'height') {
          HeightLegendChart('.mapping-legend');
        } else if (newMapping === 'width') {
          WidthLegendChart('.mapping-legend');
        } else if (newMapping === 'area') {
          AreaLegendChart('.mapping-legend');
        } else {
          // console.log('did not select amount mapping mode');
        }

      });

      showMappingLegend.value = true;  // 切换到 mapping-legend
    });

    watch(selectedDropdown, () => {
      showMappingLegend.value = false; // 切换到 average-info
    });

    onMounted(() => {
      fetchData(showAllDates.value).then(() => {
        const allKeys = legendData.value[0].children.flatMap(child => child.children.map(subChild => subChild.id));
        const allLabels = legendData.value[0].children.flatMap(child => child.children.map(subChild => subChild.label));

        legendTree.value.setCheckedKeys(allKeys);
        selectedCategories.value = new Set(allLabels);
        // console.log('selectedCategories11', selectedCategories);
        selectedKeys.value = allKeys; // 初始状态下保存所有键值

        legendTree.value.setCheckedKeys(selectedKeys.value); // 恢复之前的选中状态
        const result = EventSequenceChart(jsonData.value, worksheet.value, showAllDates.value, selectedCategories.value, selectedMapping.value);
        dailySequences.value = result.dailySequences;
        yearPositions.value = result.yearPositions;
        // console.log("dailySequences in onMounted:", dailySequences.value);

        // 绘制初始图例（如果映射选择为“height”）
        if (selectedMapping.value === 'height') {
          HeightLegendChart('.mapping-legend'); // 传入图例的容器选择器
        } else if (selectedMapping.value === 'width') {
          WidthLegendChart('.mapping-legend');
        } else if (selectedMapping.value === 'area') {
          AreaLegendChart('.mapping-legend');
        }

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
      // findMostSimilarSequence(dailySequences, dailyAmounts, selectedOption.value, selectedAlgorithm.value)

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
    // console.log("dailySequences:", dailySequences);
    // console.log("dailyAmounts:", dailyAmounts);

    return {
      jsonData,
      worksheet,
      parsedData,
      showAllDates,
      isDarkMode,
      selectedAlgorithm,
      selectedMapping,
      selectedOption,
      selectedCategories,
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
      selectedDetails,
      showDetail,
      handleUpdateTopSimilarSequences,
      topSimilarSequences,
      yearPositions,
      containerRef,
      handleYearClick,
      selectedDescription,
      dailyAmounts,
      listAmounts,
      selectedSimilarDetails,
      handleSelectSimilarSequence,
      showTransactionDetail,
      selectedDropdown,
      showMappingLegend,
    };
  }
};
</script>

<style scoped>
.custom-tree {
  max-width: 600px;
  height: 100%;
  overflow-y: auto;
  width: 280px;
  /*padding-right: 30px;*/
  border-right: 2px solid #E4E4E4;
  background-color: inherit;  /* 继承父容器的背景色 */
}

.custom-tree >>> .el-tree-node__content {
  height: 16px; /* 每个树节点内容的高度 */
  font-size: 12px;
}

#user-option{
  display: flex;
  flex-direction: column;
  justify-content: center;
  /*align-items: center;*/
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
}

.up-half-page, .down-half-page{
  width: 100%;
  display: flex;
  justify-content: left;
  padding: 10px;
}

.el-switch {
  display: inline-flex;
  /*align-items: center;*/
  justify-content: center;
  width: 100px;
  height: 25px;
}

.el-switch >>> .el-switch__core {
  height: 100% !important;
  width: 100% !important;
  border-radius: 20px;
}

</style>
