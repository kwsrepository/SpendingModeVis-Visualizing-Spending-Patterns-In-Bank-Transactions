<template>
  <div class="month-view">
    <el-switch
      v-model="showOnlyHighlightedMonths"
      active-text="Show Only Highlighted Months"
      inactive-text="Show All Months"
      class="custom-switch">
    </el-switch>
    <div v-for="year in years" :key="year" class="year-section">
      <h2>{{ year }}</h2>
      <div class="month-calendars">
        <div v-for="month in filteredMonths(year)" :key="month.index" class="calendar-container">
          <div class="calendar-header">{{ month.name }}</div>
          <div class="days-grid">
            <div class="day-name" v-for="day in dayNames" :key="day">{{ day }}</div>
            <div v-for="day in getDaysInMonth(year, month.index)" :key="day.date" :class="['day', { highlight: highlightDates.includes(day.date) }]">
              <div class="day-content">
                <span>{{ day.number }}</span>
                <div v-if="highlightDates.includes(day.date)" class="extra-content">
                  {{ getSimilarity(day.date) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import { ElSwitch } from 'element-plus';

export default {
  name: 'MonthView',
  components: {
    ElSwitch,
  },
  props: {
    highlightDates: {
      type: Array,
      required: false,
      default: () => []
    },
    topSimilarSequences: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      showOnlyHighlightedMonths: false,
      years: Array.from({ length: 8 }, (_, i) => 2015 + i),
      months: [
        { name: 'January', index: 0 },
        { name: 'February', index: 1 },
        { name: 'March', index: 2 },
        { name: 'April', index: 3 },
        { name: 'May', index: 4 },
        { name: 'June', index: 5 },
        { name: 'July', index: 6 },
        { name: 'August', index: 7 },
        { name: 'September', index: 8 },
        { name: 'October', index: 9 },
        { name: 'November', index: 10 },
        { name: 'December', index: 11 }
      ],
      dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    };
  },
  methods: {
    getDaysInMonth(year, monthIndex) {
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const firstDay = new Date(year, monthIndex, 1).getDay();
      const days = [];

      for (let i = 0; i < firstDay; i++) {
        days.push({ date: null, number: '', extraContent: '' });
      }
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(Date.UTC(year, monthIndex, day)).toISOString().split('T')[0];
        days.push({ date, number: day, extraContent: '' });
      }
      return days;
    },
    getSimilarity(date) {
      const seq = this.topSimilarSequences.find(seq => seq.date === date);
      return seq ? seq.similarity.toFixed(2) : '';
    },
    isMonthHighlighted(year, monthIndex) {
      const daysInMonth = this.getDaysInMonth(year, monthIndex);
      return daysInMonth.some(day => day.date && this.highlightDates.includes(day.date));
    },
    filteredMonths(year) {
      return this.showOnlyHighlightedMonths
        ? this.months.filter(month => this.isMonthHighlighted(year, month.index))
        : this.months;
    }
  }
};
</script>


<style scoped>
.month-view {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.year-section {
  margin-bottom: 40px;
  width: 100%;
}

.year-section h2 {
  text-align: center;
  margin-bottom: 20px;
}

.month-calendars {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.calendar-container {
  margin: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 5px;
  width: 320px;
}

.calendar-header {
  text-align: center;
  font-weight: bold;
  margin-bottom: 10px;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day-name {
  font-weight: bold;
  text-align: center;
  width: 30px;
  margin-left: auto;
  margin-right: auto;
}

.day {
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border: none;
  position: relative;
  margin-left: auto;
  margin-right: auto;
}

.day-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.highlight {
  background-color: #ffecb3 !important;
  border-radius: 50% !important;
  font-weight: bold !important;
  color: red !important;
}

.extra-content {
  font-size: 10px;
  color: #555;
  position: absolute;
  bottom: 5px;
  text-align: center;
}

.el-switch {
  margin-bottom: 20px;
  width: 100%;
}

</style>
