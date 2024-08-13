<template>
  <div v-if="visible" class="transaction-detail">
    <el-tabs type="border-card" class="custom-tabs">
      <div class="header">
        <!--        <p class="text-style">{{ details }}</p>-->
        <el-button @click="close" class="close-button">Close</el-button>
      </div>
      <el-tab-pane label="Month View" class="text-style">
        <month-view :highlightDates="similarDates" :topSimilarSequences="topSimilarSequences" />
        <el-backtop :right="100" :bottom="100" target=".custom-tabs" />
      </el-tab-pane>
      <el-tab-pane label="Year View" class="text-style">
        <div v-for="year in years" :key="year" class="year-container">
          <year-view :year="year" :highlight-dates="similarDates" />
        </div>
        <el-backtop :right="100" :bottom="100" target=".custom-tabs" />
      </el-tab-pane>
<!--      <el-tab-pane label="Timeline" class="text-style">-->
<!--        <h2>Timeline</h2>-->
<!--        <el-backtop :right="100" :bottom="100" target=".custom-tabs" />-->
<!--      </el-tab-pane>-->
    </el-tabs>
  </div>
</template>

<script>
import { ref, watch, nextTick } from 'vue';
import { ElTabs, ElTabPane, ElButton, ElBacktop } from 'element-plus';
import { findTopSimilarSequences, findTopSimilarSequencesByAmount } from '@/services/sequenceSimilarity';
// import { segmentWidths, widthSegments } from '@/services/sizeMapping';
import YearView from './YearView.vue';
import MonthView from './MonthView.vue';
import '@/assets/global.css';
// import TopSimilarList from './topSimilarList.vue';

export default {
  name: 'TransactionSimilarity',
  components: {
    ElTabs,
    ElTabPane,
    ElButton,
    ElBacktop,
    YearView,
    MonthView
  },
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    details: {
      type: Object,
      required: false
    },
    dailySequences: {
      type: Object,
      required: true
    },
    dailyAmounts: {
      type: Object,
      required: true
    },
    algorithm: {
      type: String,
      required: true
    },
    selectedOption: {
      type: String,
      required: true
    }
  },
  setup(props, { emit }) {
    const currentDate = ref(new Date());
    const selectedDate = ref(new Date());
    const topSimilarSequences = ref([]);
    const similarDates = ref([]);
    const years = ref([2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022]);

    const formatDate = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const clearHighlight = () => {
      const cells = document.querySelectorAll('.el-calendar-table__row .el-calendar-day span.highlight');
      cells.forEach(cell => {
        cell.classList.remove('highlight');
        cell.style.backgroundColor = '';
        cell.style.borderRadius = '';
        cell.style.fontWeight = '';
        cell.style.color = '';

        const similarityText = cell.parentNode.querySelector('.similarity-text');
        if (similarityText) {
          cell.parentNode.removeChild(similarityText);
        }
      });
    };

    const highlightDates = () => {
      nextTick(() => {
        clearHighlight();
        const dates = similarDates.value;
        const cells = document.querySelectorAll('.el-calendar-table__row .el-calendar-day');
        const currentMonth = currentDate.value.getMonth();
        const currentYear = currentDate.value.getFullYear();

        cells.forEach(cell => {
          const span = cell.querySelector('span');
          if (!span) return;

          const cellDateText = span.textContent.trim();
          const cellDate = new Date(currentYear, currentMonth, parseInt(cellDateText));
          const formattedCellDate = formatDate(cellDate);

          if (dates.includes(formattedCellDate) && cellDate.getMonth() === currentMonth) {
            span.classList.add('highlight');
            span.style.backgroundColor = '#ffecb3';
            span.style.borderRadius = '50%';
            span.style.fontWeight = 'bold';
            span.style.color = 'red';

            const similarity = topSimilarSequences.value.find(seq => seq.date === formattedCellDate).similarity.toFixed(2);
            const similarityText = document.createElement('div');
            similarityText.className = 'similarity-text';
            similarityText.innerText = `${similarity}%`;
            similarityText.style.fontSize = '10px';
            similarityText.style.color = 'blue';
            similarityText.style.textAlign = 'center';
            similarityText.style.position = 'absolute';
            similarityText.style.bottom = '2px';
            similarityText.style.width = '100%';
            similarityText.style.pointerEvents = 'none'; // 确保不会影响用户交互
            cell.style.position = 'relative'; // 确保父容器正确定位
            cell.appendChild(similarityText); // 确保相似度文本在单元格中
          }
        });
      });
    };

    const updateSimilarSequences = () => {
      if (props.details && props.details.date) {
        const dateMatch = props.details.date; // 获取日期
        const selectedSequence = props.dailySequences[dateMatch];

        if (selectedSequence) {
          // 创建 targetAmountsSum 数组
          const targetAmountsSum = props.dailyAmounts[dateMatch].debitAmounts.map((debit, index) => {
            return debit + props.dailyAmounts[dateMatch].creditAmounts[index];
          });

          // console.log("Target Amounts Sum Array:", targetAmountsSum);

          const allSequences = Object.keys(props.dailySequences).map(date => {
            const debitAmounts = props.dailyAmounts[date].debitAmounts;
            const creditAmounts = props.dailyAmounts[date].creditAmounts;

            // 创建 amountsSum 数组
            const amountsSum = debitAmounts.map((debit, index) => {
              return debit + creditAmounts[index];
            });

            // console.log(`Amounts Sum Array for ${date}:`, amountsSum);

            return {
              date,
              sequence: props.dailySequences[date],
              debitAmounts,  // 使用传入的 dailyAmounts
              creditAmounts, // 使用传入的 dailyAmounts
              amountsSum     // 新生成的 amountsSum 数组
            };
          });

          if (props.selectedOption === 'category') {
            topSimilarSequences.value = findTopSimilarSequences(selectedSequence, allSequences, props.algorithm);
          } else if (props.selectedOption === 'amount') {
            // 使用基于金额的相似度计算函数
            const targetSequence = {
              date: dateMatch,
              sequence: selectedSequence,
              debitAmounts: props.dailyAmounts[dateMatch].debitAmounts, // 使用传入的 dailyAmounts
              creditAmounts: props.dailyAmounts[dateMatch].creditAmounts, // 使用传入的 dailyAmounts
              amountsSum: targetAmountsSum // 使用新生成的 targetAmountsSum 数组
            };

            topSimilarSequences.value = findTopSimilarSequencesByAmount(targetSequence, allSequences);
          }

          similarDates.value = topSimilarSequences.value.map(seq => seq.date);
          highlightDates();
          emit('update-top-similar-sequences', topSimilarSequences.value);
        }
      }
    };



    watch(() => props.details, updateSimilarSequences);
    watch(() => props.algorithm, updateSimilarSequences);
    watch(() => props.selectedOption, updateSimilarSequences);

    // watch(() => props.algorithm, (newAlgorithm) => {
    //   console.log("Selected Algorithm:", newAlgorithm);
    // });

    // watch(topSimilarSequences, (newTopSimilarSequences) => {
    //   const dates = newTopSimilarSequences.map(seq => seq.date);
    //   // console.log("Similar Dates:", dates);
    //   similarDates.value = dates;
    //   highlightDates();
    // });

    const close = () => {
      emit('close');
    };

    return {
      currentDate,
      selectedDate,
      topSimilarSequences,
      similarDates,
      close,
      years
    };
  }
};
</script>


<style scoped>
.transaction-detail {
  position: fixed;
  right: 0;
  top: 0;
  height: 100%;
  width: 750px;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
  border: 2px solid #E4E4E4;
  border-radius: 8px;
  overflow-y: auto;
  z-index: 1000;
  background-color: inherit;  /* 继承父容器的背景色 */
  display: flex;
  justify-content: center;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1; /* 确保按钮在内容上方 */
}

.custom-tabs {
  width: 100%;
  background-color: inherit;  /* 继承父容器的背景色 */
  border: none;
  max-height: 1000px; /* 设置合适的高度以触发滚动 */
  overflow-y: auto;
  position: relative;
}

.el-tabs__header {
  display: flex;
}

.el-tabs__item {
  flex: 1;
  text-align: center;
}

.close-button {
  margin-left: auto; /* 确保按钮在最右侧 */
  z-index: 2; /* 确保按钮在内容上方 */
}

.el-calendar-table__row .el-calendar-day span.highlight {
  background-color: #ffecb3 !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  height: 100% !important;
  box-sizing: border-box !important;
  border: 2px solid #ffeb3b !important;
  font-weight: bold !important;
  color: red !important;
}

.similarity-text {
  font-size: 10px;
  color: blue;
  text-align: center;
  position: absolute;
  bottom: 2px;
  width: 100%;
  pointer-events: none; /* 确保不会影响用户交互 */
}

.el-calendar {
  --el-calendar-cell-width: 30px; /* 日历单元格的宽度 */
  --el-calendar-cell-height: 30px; /* 日历单元格的高度 */
  border: none;
}

.el-calendar-table__row .el-calendar-day {
  width: var(--el-calendar-cell-width);
  height: var(--el-calendar-cell-height);
  line-height: var(--el-calendar-cell-height);
}

.el-calendar-table .el-calendar-day {
  padding: 5px; /* 将 padding 从 8px 改为 5px */
}

.year-container {
  margin-bottom: 20px;
}

</style>
