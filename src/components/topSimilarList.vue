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
        </div>
      </li>
      <li v-for="(seq, index) in filteredTopSimilarSequences" :key="index">
        <span :class="['day-of-week', getDayClass(getDayOfWeek(seq.date))]">{{ getDayOfWeek(seq.date) }} </span>
        <span class="list-date"> {{ seq.date }} </span>:
        <span v-html="renderSequenceWithTooltip(seq.sequence, seq.date)"></span>
        <span class = "list-text">(Similarity {{ seq.similarity.toFixed(2) }}%) </span>
      </li>
    </ul>
  </div>
</template>

<script>
import { colorMappingNew } from '@/services/colorMapping.js';
import { charToSubCategory } from '@/services/StringMapping.js';
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
    }
  },
  data() {
    return {
      renderedSelectedSequence: ''
    };
  },
  mounted() {
    console.log('listAmounts:', this.listAmounts);
  },
  watch: {
    selectedDetails(newVal) {
      if (newVal && newVal.date && newVal.sequence) {
        this.renderedSelectedSequence = this.renderSequenceWithTooltip(newVal.sequence, newVal.date);
      }
    }
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

      for (let i = 0; i < sequence.length; i++) {
        const char = sequence[i];
        const color = colorMappingNew[char] || 'transparent';
        const subCategory = charToSubCategory[char] || 'Unknown';
        const debitAmount = debitAmounts[i] !== 0 ? `, Debit Amount: ${debitAmounts[i]}` : '';
        const creditAmount = creditAmounts[i] !== 0 ? `, Credit Amount: ${creditAmounts[i]}` : '';
        const tooltip = `Date: ${date}, Char: ${char}, SubCategory: ${subCategory}${debitAmount}${creditAmount}`;
        result += `<span title="${tooltip}" style="display: inline-block; width: 15px; height: 18px; background-color: ${color};"></span>`;
      }
      result += `<span style="margin-left: 15px;">${sequence}</span>`; // 添加序列字符串
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
    }
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

