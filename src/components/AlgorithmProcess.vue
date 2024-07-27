<template>
  <div v-if="details">
    <!--    <h3>Compare Details</h3>-->
    <div id="sequence-visualization-container">
      <span :class="['day-of-week', getDayClass(getDayOfWeek(details.date))]">{{ getDayOfWeek(details.date) }}</span>
      <span class="list-date">{{ details.date }}</span>
      <div id="sequence-visualization"></div>
      <span class="original-sequence">{{ details.sequence }}</span>
      <span class = "list-text">(Target Sequence) </span>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3';
import { colorMappingNew } from '@/services/colorMapping.js';
import { charToSubCategory } from '@/services/StringMapping.js';
import '@/assets/global.css';

export default {
  name: 'AlgorithmProcess',
  props: {
    details: {
      type: Object,
      required: true
    }
  },
  mounted() {
    if (this.details && this.details.sequence) {
      this.drawSequence(this.details.sequence);
    }
  },
  watch: {
    details(newVal) {
      if (newVal && newVal.sequence) {
        this.drawSequence(newVal.sequence);
      }
    }
  },
  methods: {
    drawSequence(sequence) {
      if (!sequence) return;

      // 清空之前的SVG内容
      d3.select("#sequence-visualization").selectAll("*").remove();

      const svgWidth = sequence.length * 15;
      const svg = d3.select("#sequence-visualization").append("svg")
        .attr("width", svgWidth)
        .attr("height", 18);

      svg.selectAll("rect")
        .data(sequence)
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * 15)
        .attr("y", 0)
        .attr("width", 15)
        .attr("height", 18)
        .attr("fill", d => this.getColor(d))
        .append("title") // 用于显示tooltip
        .text((d, i) => {
          const subCategory = charToSubCategory[d] || 'Unknown';
          const debitAmount = this.details.debitAmounts && this.details.debitAmounts[i] !== 0 ? `, Debit Amount: ${this.details.debitAmounts[i]}` : '';
          const creditAmount = this.details.creditAmounts && this.details.creditAmounts[i] !== 0 ? `, Credit Amount: ${this.details.creditAmounts[i]}` : '';
          return `Date: ${this.details.date}, Char: ${d}, SubCategory: ${subCategory}${debitAmount}${creditAmount}`;
        });
    },
    getColor(char) {
      return colorMappingNew[char] || 'transparent';
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
#sequence-visualization-container {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.list-date {
  margin-right: 5px;
}

#sequence-visualization {
  display: inline-block;
}

.original-sequence {
  margin-left: 15px;
  text-align: left;
}

</style>
