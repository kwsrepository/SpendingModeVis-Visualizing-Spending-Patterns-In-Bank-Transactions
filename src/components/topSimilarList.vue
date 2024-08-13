<template>
  <div v-if="topSimilarSequences.length" class="similar-sequences">
    <!--    <h3 class="text-style">Top 10 Similar Sequences</h3>-->
    <ul>
      <li>
        <div v-if="selectedDetails" class="selected-sequence">
          <span :class="['day-of-week', getDayClass(getDayOfWeek(selectedDetails.date))]">{{ getDayOfWeek(selectedDetails.date) }} </span>
          <span class="list-date"> {{ selectedDetails.date }} </span>:
          <span v-html="renderedSelectedSequence"></span>
          <span class = "list-text">(Target Sequence) </span>
          <span class="amount-sum"> Amounts: [ {{ calculateAmountSum(selectedDetails.date) }} ] </span>
        </div>
      </li>
      <li v-for="(seq, index) in filteredTopSimilarSequences" :key="index" @click="selectSimilarSequence(seq)">
        <span :class="['day-of-week', getDayClass(getDayOfWeek(seq.date))]">{{ getDayOfWeek(seq.date) }} </span>
        <span class="list-date"> {{ seq.date }} </span>:
        <span v-html="renderSequenceWithTooltip(seq.sequence, seq.date)"></span>
        <span class="list-text">{{ formattedSimilarityText(seq.similarity) }}</span>
        <span class="amount-sum"> Amounts: [ {{ calculateAmountSum(seq.date) }} ] </span>
      </li>
    </ul>
  </div>
</template>

<script>
import { colorMappingNew } from '@/services/colorMapping.js';
import { charToSubCategory } from '@/services/StringMapping.js';
import { mapHeight, mapWidth, mapArea } from '@/services/sizeMapping.js';
import '@/assets/global.css';

export default {
  name: 'TopSimilarList',
  props: {
    topSimilarSequences: {
      type: Array,
      required: true
    },
    selectedDetails: {
      type: Object,
      required: true
    },
    listAmounts: {
      type: Object,
      required: true
    },
    selectedMapping: {
      type: String,
      required: true
    },
    selectedOption: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      renderedSelectedSequence: ''
    };
  },
  mounted() {
    // console.log('listAmounts:', this.listAmounts);
    // console.log('selectedMapping:', this.selectedMapping);
  },
  watch: {
    selectedDetails(newVal) {
      if (newVal && newVal.date && newVal.sequence) {
        this.renderedSelectedSequence = this.renderSequenceWithTooltip(newVal.sequence, newVal.date);
      }
    },
    selectedMapping() {
      this.renderedSelectedSequence = this.renderSequenceWithTooltip(this.selectedDetails.sequence, this.selectedDetails.date);
    },
    // selectedOption(newVal) {
    //   console.log('selectedOption changed to:', newVal);
    // },
  },
  computed: {
    filteredTopSimilarSequences() {
      return this.topSimilarSequences.filter(seq => seq.date !== this.selectedDetails.date);
    }
  },
  methods: {
    renderSequenceWithTooltip(sequence, date) {
      let result = '';
      const debitAmounts = this.listAmounts[date]?.debitAmounts || [];
      const creditAmounts = this.listAmounts[date]?.creditAmounts || [];

      // 生成交易数据数组
      let transactions = sequence.split('').map((char, index) => {
        return {
          char,
          debitAmount: debitAmounts[index] || 0,
          creditAmount: creditAmounts[index] || 0,
          subCategory: charToSubCategory[char] || 'Unknown'
        };
      });

      // 根据 selectedMapping 的值应用不同的映射
      if (this.selectedMapping === 'height') {
        transactions = mapHeight(transactions);
      } else if (this.selectedMapping === 'width') {
        transactions = mapWidth(transactions);
      } else if (this.selectedMapping === 'area') {
        transactions = mapArea(transactions);
      }

      // 设置对齐方式
      let verticalAlign = 'baseline'; // 默认对齐方式
      if (this.selectedMapping === 'none' || this.selectedMapping === 'width' || this.selectedMapping === 'area') {
        verticalAlign = 'middle'; // 中线对齐
      }

      // 绘制方块
      transactions.forEach(d => {
        const color = colorMappingNew[d.char] || 'transparent';

        let tooltip = `Date: ${date}, Char: ${d.char}, SubCategory: ${d.subCategory}`;
        if (d.debitAmount !== 0) {
          tooltip += `, Debit Amount: ${d.debitAmount}`;
        }
        if (d.creditAmount !== 0) {
          tooltip += `, Credit Amount: ${d.creditAmount}`;
        }

        const width = d.mappedWidth || 15; // 默认宽度
        const height = d.mappedHeight || 18; // 默认高度
        result += `<span title="${tooltip}" style="display: inline-block; width: ${width}px; height: ${height}px; background-color: ${color}; vertical-align: ${verticalAlign};"></span>`;
      });

      result += `<span style="margin-left: 15px; vertical-align: ${verticalAlign};">${sequence}</span>`; // 添加序列字符串
      return result;
    },
    getDayOfWeek(date) {
      const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
      const day = new Date(date).getDay();
      return daysOfWeek[day];
    },
    getDayClass(day) {
      const dayMap = {
        Mo: 'monday',
        Tu: 'tuesday',
        We: 'wednesday',
        Th: 'thursday',
        Fr: 'friday',
        Sa: 'saturday',
        Su: 'sunday'
      };
      return dayMap[day] || '';
    },
    selectSimilarSequence(seq) {
      const similarDetails = {
        date: seq.date,
        sequence: seq.sequence,
        debitAmounts: this.listAmounts[seq.date]?.debitAmounts || [],
        creditAmounts: this.listAmounts[seq.date]?.creditAmounts || [],
      };
      this.$emit('select-similar-sequence', similarDetails);
    },
    formattedSimilarityText(similarity) {
      if (this.selectedOption === 'category') {
        return `(Similarity. ${similarity.toFixed(2)}%)`;
      } else if (this.selectedOption === 'amount') {
        return `(Distance. ${similarity.toFixed(2)})`;
      }
      return ''; // 处理其他可能的情况
    },
    calculateAmountSum(date) {
      const debitAmounts = this.listAmounts[date]?.debitAmounts || [];
      const creditAmounts = this.listAmounts[date]?.creditAmounts || [];

      return debitAmounts.map((debit, index) => debit + creditAmounts[index]).join(', ');
    },
  }
};
</script>

<style scoped>
.similar-sequences {
  /*margin-top: 20px;*/
  justify-content: left;
  margin-bottom: auto;
  margin-top: auto;
  width: fit-content;
}

.similar-sequences h3 {
  margin-bottom: 3px;
  margin-top: 8px;
}

.similar-sequences ul {
  list-style-type: none;
  padding: 0;
}

.similar-sequences li {
  margin-bottom: 5px;
}

.list-date {
  margin-right: 5px;
}

</style>

