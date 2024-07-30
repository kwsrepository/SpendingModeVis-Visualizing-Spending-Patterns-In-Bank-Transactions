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
  <div v-if="similarDetails">
    <div id="similar-sequence-visualization-container">
      <span :class="['day-of-week', getDayClass(getDayOfWeek(similarDetails.date))]">{{ getDayOfWeek(similarDetails.date) }}</span>
      <span class="list-date">{{ similarDetails.date }}</span>
      <div id="similar-sequence-visualization"></div>
      <span class="similar-sequence">{{ similarDetails.sequence }}</span>
      <span class="list-text">(Selected Similar Sequence) </span>
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
    },
    similarDetails: {
      type: Object,
      required: false
    }
  },
  mounted() {
    if (this.details && this.details.sequence) {
      this.drawSequence(this.details.sequence, "#sequence-visualization", this.details);
    }
    if (this.similarDetails && this.similarDetails.sequence) {
      this.drawSequence(this.similarDetails.sequence, "#similar-sequence-visualization", this.similarDetails);
    }
  },
  watch: {
    details(newVal) {
      if (newVal && newVal.sequence) {
        this.drawSequence(newVal.sequence, "#sequence-visualization", newVal);
      }
    },
    similarDetails(newVal) {
      if (newVal && newVal.sequence) {
        this.drawSequence(newVal.sequence, "#similar-sequence-visualization", newVal);
      }
    }
  },
  methods: {
    drawSequence(sequence, containerId, data) {
      if (!sequence) return;

      // 清空之前的SVG内容
      d3.select(containerId).selectAll("*").remove();
      d3.select("#similar-sequence-visualization").selectAll("*").remove();

      const svgWidth = sequence.length * 15;
      const svg = d3.select(containerId).append("svg")
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
          const debitAmount = data.debitAmounts && data.debitAmounts[i] !== 0 ? `, Debit Amount: ${data.debitAmounts[i]}` : '';
          const creditAmount = data.creditAmounts && data.creditAmounts[i] !== 0 ? `, Credit Amount: ${data.creditAmounts[i]}` : '';
          return `Date: ${data.date}, Char: ${d}, SubCategory: ${subCategory}${debitAmount}${creditAmount}`;
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
#sequence-visualization-container, #similar-sequence-visualization-container {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.list-date {
  margin-right: 5px;
}

#sequence-visualization, #similar-sequence-visualization {
  display: inline-block;
}

.original-sequence, .similar-sequence {
  margin-left: 15px;
  text-align: left;
}

</style>

