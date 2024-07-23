<template>
  <div v-if="visible" class="transaction-detail">
    <div class="header">
      <p>{{ details }}</p>
      <el-button @click="close" class="close-button">Close</el-button>
    </div>
    <el-tabs type="border-card" class="custom-tabs">
      <el-tab-pane label="Month View">
        <el-calendar
          ref="calendar"
          v-model="currentDate"
          @input="handleDateChange">
          <template #header="{ date }">
            <span>{{ date }}</span>
            <el-button-group>
              <el-button size="small" @click="selectDate('prev-year')">Previous Year</el-button>
              <el-button size="small" @click="selectDate('prev-month')">Previous Month</el-button>
              <el-button size="small" @click="goToCurrentDay">Current Day</el-button>
              <el-button size="small" @click="selectDate('next-month')">Next Month</el-button>
              <el-button size="small" @click="selectDate('next-year')">Next Year</el-button>
            </el-button-group>
          </template>
        </el-calendar>
        <div v-if="topSimilarSequences.length" class="similar-sequences">
          <h3>Top 10 Similar Sequences</h3>
          <ul>
            <li v-for="(seq, index) in topSimilarSequences" :key="index">
              {{ seq.date }}: {{ seq.sequence }} ({{ seq.similarity.toFixed(2) }}%)
            </li>
          </ul>
        </div>
      </el-tab-pane>
      <el-tab-pane label="Year View">
        <div class="year-view">
          <div class="year-header">{{ currentYear }}</div>
          <div class="months">
            <div class="month" v-for="(month, index) in months" :key="index">
              <div class="month-header">{{ month.name }}</div>
              <div class="days">
                <div class="day" v-for="day in month.days" :key="day">
                  {{ day }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="Timeline">
        <h2>Timeline</h2>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
export default {
  data() {
    return {
      visible: true,
      details: 'Transaction Details',
      currentDate: new Date(),
      currentYear: new Date().getFullYear(),
      topSimilarSequences: [],
      months: [
        { name: 'January', days: this.generateDays(31) },
        { name: 'February', days: this.generateDays(28) }, // Adjust for leap years
        { name: 'March', days: this.generateDays(31) },
        { name: 'April', days: this.generateDays(30) },
        { name: 'May', days: this.generateDays(31) },
        { name: 'June', days: this.generateDays(30) },
        { name: 'July', days: this.generateDays(31) },
        { name: 'August', days: this.generateDays(31) },
        { name: 'September', days: this.generateDays(30) },
        { name: 'October', days: this.generateDays(31) },
        { name: 'November', days: this.generateDays(30) },
        { name: 'December', days: this.generateDays(31) }
      ]
    };
  },
  methods: {
    close() {
      this.visible = false;
    },
    handleDateChange(value) {
      this.currentDate = value;
    },
    selectDate(action) {
      const date = new Date(this.currentDate);
      if (action === 'prev-year') {
        date.setFullYear(date.getFullYear() - 1);
      } else if (action === 'prev-month') {
        date.setMonth(date.getMonth() - 1);
      } else if (action === 'next-month') {
        date.setMonth(date.getMonth() + 1);
      } else if (action === 'next-year') {
        date.setFullYear(date.getFullYear() + 1);
      }
      this.currentDate = date;
    },
    goToCurrentDay() {
      this.currentDate = new Date();
    },
    generateDays(count) {
      return Array.from({ length: count }, (_, i) => i + 1);
    }
  }
};
</script>

<style scoped>
.year-view {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.year-header {
  font-size: 24px;
  margin-bottom: 20px;
}

.months {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.month {
  width: 200px;
  margin: 10px;
}

.month-header {
  font-size: 18px;
  text-align: center;
  margin-bottom: 10px;
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}

.day {
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #ddd;
}
</style>
