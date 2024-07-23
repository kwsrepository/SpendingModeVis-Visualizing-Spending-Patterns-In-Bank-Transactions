<template>
  <div class="month-view">
    <div v-for="year in years" :key="year" class="year-section">
      <h2>{{ year }}</h2>
      <div class="month-calendars">
        <div v-for="month in months" :key="month.index" class="calendar-container">
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
export default {
  name: 'MonthView',
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
  margin: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 10px;
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
  padding: 5px 0;
}

.day {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border: 1px solid #eee;
  position: relative;
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
</style>
