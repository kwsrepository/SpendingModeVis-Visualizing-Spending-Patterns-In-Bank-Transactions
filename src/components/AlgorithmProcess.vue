<template>
  <!--  <div v-if="details">-->
  <!--    <div id="sequence-visualization-container">-->
  <!--      <span :class="['day-of-week', getDayClass(getDayOfWeek(details.date))]">{{ getDayOfWeek(details.date) }}</span>-->
  <!--      <span class="list-date">{{ details.date }}</span>-->
  <!--      <div id="sequence-visualization"></div>-->
  <!--      <span class="original-sequence">{{ details.sequence }}</span>-->
  <!--      <span class = "list-text">(Target Sequence) </span>-->
  <!--    </div>-->
  <!--  </div>-->
  <!--  <div v-if="similarDetails">-->
  <!--    <div id="similar-sequence-visualization-container">-->
  <!--      <span :class="['day-of-week', getDayClass(getDayOfWeek(similarDetails.date))]">{{ getDayOfWeek(similarDetails.date) }}</span>-->
  <!--      <span class="list-date">{{ similarDetails.date }}</span>-->
  <!--      <div id="similar-sequence-visualization"></div>-->
  <!--      <span class="similar-sequence">{{ similarDetails.sequence }}</span>-->
  <!--      <span class="list-text">(Selected Similar Sequence) </span>-->
  <!--    </div>-->
  <!--  </div>-->

  <div>
    <h3>Most Frequent Consumption Mode (unit/day)</h3>
    <div>
      <h4>Based on Category (similarities above 90% are considered similar)</h4>
      <ul>
        <li>
          <strong>Levenshtein Distance Algorithm:</strong>
          <!--          <p>{{ getMostSimilarSequence('category', 'levenshtein') }}</p>-->
          <div class="sequence-container" id="sequence-levenshtein">
            <span>2022-07-07:</span>
            <div id="sequence-levenshtein-draw"></div>
            <span>(has 129 similar sequence)</span>
            <span v-html="displaySequenceInfo('2022-07-07')"></span>
          </div>
        </li>
        <li>
          <strong>Damerau-Levenshtein Distance Algorithm:</strong>
          <!--          <p>{{ getMostSimilarSequence('category', 'damerau-levenshtein') }}</p>-->
          <div class="sequence-container" id="sequence-damerau">
            <span>2022-07-07:</span>
            <div id="sequence-damerau-draw"></div>
            <span>(has 129 similar sequence)</span>
            <span v-html="displaySequenceInfo('2022-07-07')"></span>
          </div>
        </li>
        <li>
          <strong>Hamming Distance Algorithm:</strong>
          <!--          <p>{{ getMostSimilarSequence('category', 'hamming') }}</p>-->
          <div class="sequence-container" id="sequence-hamming">
            <span>2022-07-07:</span>
            <div id="sequence-hamming-draw"></div>
            <span>(has 129 similar sequence)</span>
            <span v-html="displaySequenceInfo('2022-07-07')"></span>
          </div>
        </li>
        <li>
          <strong>Jaro-Winkler Similarity Algorithm:</strong>
          <!--          <p>{{ getMostSimilarSequence('category', 'jaro-winkler') }}</p>-->
          <div class="sequence-container" id="sequence-jaro">
            <span>2022-07-07:</span>
            <div id="sequence-jaro-draw"></div>
            <span>(has 597 similar sequence)</span>
            <span v-html="displaySequenceInfo('2022-07-07')"></span>
          </div>
        </li>
      </ul>
    </div>
    <div>
      <h4>Based on Amount (distance below 10 is considered similar)</h4>
      <ul>
        <li>
          <strong> Euclidean Distance Algorithm:</strong>
          <!--          <p>{{ getMostSimilarSequence('amount', 'levenshtein') }}</p>-->
          <div class="sequence-container" id="sequence-euclidean">
            <span>2019-12-05:</span>
            <div id="sequence-euclidean-draw"></div>
            <span>(has 364 similar sequence)</span>
            <span v-html="displaySequenceInfo('2019-12-05')"></span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3';
import { colorMappingNew } from '@/services/colorMapping.js';
import { charToSubCategory } from '@/services/StringMapping.js';
import { findMostSimilarSequence } from '@/services/sequenceSimilarity.js';
import { mapHeight, mapWidth, mapArea } from '@/services/sizeMapping.js';
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
    },
    selectedMapping: {
      type: String,
      required: true
    },
    dailySequences: Object,
    dailyAmounts: Object,
  },
  mounted() {
    // if (this.details && this.details.sequence) {
    //   this.drawSequence(this.details.sequence, "#sequence-visualization", this.details);
    // }
    // if (this.similarDetails && this.similarDetails.sequence) {
    //   this.drawSequence(this.similarDetails.sequence, "#similar-sequence-visualization", this.similarDetails);
    // }
    this.drawAllSequences();
  },
  updated() {
    this.drawAllSequences();
  },
  watch: {
    // details(newVal) {
    //   if (newVal && newVal.sequence) {
    //     this.drawSequence(newVal.sequence, "#sequence-visualization", newVal);
    //   }
    // },
    // similarDetails(newVal) {
    //   if (newVal && newVal.sequence) {
    //     this.drawSequence(newVal.sequence, "#similar-sequence-visualization", newVal);
    //   }
    // },
    dailySequences() {
      this.drawAllSequences();
    },
    dailyAmounts() {
      this.drawAllSequences();
    },
    selectedMapping() {
      this.drawAllSequences();
    },
  },
  methods: {
    drawAllSequences() {
      this.renderSequence('2022-07-07', "#sequence-levenshtein-draw");
      this.renderSequence('2022-07-07', "#sequence-damerau-draw");
      this.renderSequence('2022-07-07', "#sequence-hamming-draw");
      this.renderSequence('2022-07-07', "#sequence-jaro-draw");
      this.renderSequence('2019-12-05', "#sequence-euclidean-draw");
    },
    renderSequence(date, containerId) {
      const sequence = this.dailySequences[date];
      const debitAmounts = this.dailyAmounts[date]?.debitAmounts || [];
      const creditAmounts = this.dailyAmounts[date]?.creditAmounts || [];

      const data = {
        date,
        sequence,
        debitAmounts,
        creditAmounts,
      };

      // console.log('Rendering sequence for date:', date, 'with data:', data);

      this.drawSequence(sequence, containerId, data);
    },
    drawSequence(sequence, containerId, data) {
      if (!sequence) return;

      // 清空之前的SVG内容
      d3.select(containerId).selectAll("*").remove();
      d3.select("#similar-sequence-visualization").selectAll("*").remove();

      // 构建 transactions 数组
      let transactions = sequence.split('').map((char, index) => {
        return {
          char,
          debitAmount: data.debitAmounts[index] || 0,
          creditAmount: data.creditAmounts[index] || 0,
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

      const svgWidth = transactions.length * (transactions[0].mappedWidth || 15);
      const svgHeight = this.selectedMapping === 'height' ? Math.max(...transactions.map(d => d.mappedHeight)) : 18;

      const svg = d3.select(containerId).append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

      svg.selectAll("rect")
        .data(transactions)
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * (d.mappedWidth || 15))
        .attr("y", 0)
        .attr("width", d => d.mappedWidth || 15)
        .attr("height", d => d.mappedHeight || 18)
        .attr("fill", d => this.getColor(d.char))
        .append("title") // 用于显示tooltip
        .text(d => {
          let tooltip = `Date: ${data.date}, Char: ${d.char}, SubCategory: ${d.subCategory}`;
          if (d.debitAmount !== 0) {
            tooltip += `, Debit Amount: ${d.debitAmount}`;
          }
          if (d.creditAmount !== 0) {
            tooltip += `, Credit Amount: ${d.creditAmount}`;
          }
          return tooltip;
        });
    },
    displaySequenceInfo(date) {
      const sequence = this.dailySequences[date];
      const debitAmounts = this.dailyAmounts[date]?.debitAmounts || [];
      const creditAmounts = this.dailyAmounts[date]?.creditAmounts || [];
      const amountsSum = debitAmounts.map((debit, index) => debit + (creditAmounts[index] || 0));

      return `<span>${sequence}</span> <span style="margin-left: 10px;">Amounts: [${amountsSum.join(', ')}]</span>`;
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
    },
    getMostSimilarSequence(selectedOption, selectedAlgorithm) {
      const result = findMostSimilarSequence(
        this.dailySequences,
        this.dailyAmounts,
        selectedOption,
        selectedAlgorithm
      );
      return result
        ? `date: ${result.date}, sequence: ${result.sequence}, number of similar sequence: ${result.similarCount}`
        : 'did not find similar sequence';
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

.sequence-container {
  display: flex;
  align-items: center; /* 垂直居中内容 */
  font-size: 13px;
}

.sequence-container span {
  padding-left: 10px;
  padding-right: 10px;
}
</style>
