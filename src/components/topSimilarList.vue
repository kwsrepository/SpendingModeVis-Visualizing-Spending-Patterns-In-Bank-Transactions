<template>
  <div v-if="topSimilarSequences.length" class="similar-sequences">
    <h3 class="text-style">Top 10 Similar Sequences</h3>
    <ul>
      <li v-for="(seq, index) in topSimilarSequences" :key="index">
        {{ seq.date }}:
        <span v-html="renderSequence(seq.sequence)"></span>
        ({{ seq.similarity.toFixed(2) }}%)
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
      return result;
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
</style>
