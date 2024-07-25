<template>
  <div v-if="topSimilarSequences.length" class="similar-sequences">
    <!--    <h3 class="text-style">Top 10 Similar Sequences</h3>-->
    <ul>
      <li>
        <div v-if="selectedDetails" class="selected-sequence">
          <span class="day-of-week">{{ getDayOfWeek(selectedDetails.date) }} </span>
          <span class="list-date"> {{ selectedDetails.date }} </span>:
          <span v-html="renderedSelectedSequence"></span>
          <span class = "list-text">(Target Sequence) </span>
        </div>
      </li>
      <li v-for="(seq, index) in filteredTopSimilarSequences" :key="index">
        <span class="day-of-week">{{ getDayOfWeek(seq.date) }} </span>
        <span class="list-date"> {{ seq.date }} </span>:
        <span v-html="renderSequence(seq.sequence)"></span>
        <span class = "list-text">(Similarity {{ seq.similarity.toFixed(2) }}%) </span>
      </li>
    </ul>
  </div>
</template>

<script>
import { colorMappingNew } from '@/services/colorMapping.js';

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
    }
  },
  data() {
    return {
      renderedSelectedSequence: ''
    };
  },
  watch: {
    selectedDetails(newVal) {
      if (newVal && newVal.date && newVal.sequence) {
        this.renderedSelectedSequence = this.renderSequence(newVal.sequence);
      }
    }
  },
  computed: {
    filteredTopSimilarSequences() {
      return this.topSimilarSequences.filter(seq => seq.date !== this.selectedDetails.date);
    }
  },
  methods: {
    renderSequence(sequence) {
      let result = '';
      for (let i = 0; i < sequence.length; i++) {
        const char = sequence[i];
        const color = colorMappingNew[char] || 'transparent';
        result += `<span style="display: inline-block; width: 15px; height: 18px; background-color: ${color}; margin-right: .1px;"></span>`;
      }
      result += `<span style="margin-left: 15px;">${sequence}</span>`; // 添加序列字符串
      return result;
    },
    getDayOfWeek(date) {
      const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
      const day = new Date(date).getDay();
      return daysOfWeek[day];
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

.day-of-week {
  display: inline-block;
  width: 30px; /* 根据实际需求调整宽度 */
  text-align: right;
  margin-right: 5px; /* 调整与日期的间距 */
}

.list-text {
  margin-left: 15px;
}

.list-date {
  margin-right: 5px;
}

</style>
