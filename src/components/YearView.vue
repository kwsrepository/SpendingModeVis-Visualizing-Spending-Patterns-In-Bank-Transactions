<template>
  <div class="year-view">
    <div class="year-header">{{ year }}</div>
    <div class="year-grid">
      <div class="month" v-for="month in months" :key="month.name">
        <div class="month-header">{{ month.name }}</div>
        <div class="days-grid">
          <div class="day-name" v-for="day in dayNames" :key="day">{{ day }}</div>
          <div v-for="day in month.days" :key="day.date" :class="['day', { highlight: highlightDates.includes(day.date) }]">
            {{ day.number }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import '@/assets/global.css';

export default {
  name: 'YearView',
  props: {
    year: {
      type: Number,
      required: true
    },
    highlightDates: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      months: [
        { name: 'January', days: [] },
        { name: 'February', days: [] },
        { name: 'March', days: [] },
        { name: 'April', days: [] },
        { name: 'May', days: [] },
        { name: 'June', days: [] },
        { name: 'July', days: [] },
        { name: 'August', days: [] },
        { name: 'September', days: [] },
        { name: 'October', days: [] },
        { name: 'November', days: [] },
        { name: 'December', days: [] }
      ],
      dayNames: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    };
  },
  watch: {
    year: 'generateCalendar'
  },
  mounted() {
    this.generateCalendar();
  },
  methods: {
    generateCalendar() {
      const year = this.year;
      this.months.forEach((month, index) => {
        const daysInMonth = new Date(Date.UTC(year, index + 1, 0)).getDate();
        const firstDay = new Date(Date.UTC(year, index, 1)).getDay();

        month.days = [];
        for (let i = 0; i < firstDay; i++) {
          month.days.push({ date: null, number: '' });
        }
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(Date.UTC(year, index, day)).toISOString().split('T')[0];
          month.days.push({ date, number: day });
        }
      });
    }
  }
};
</script>

<style scoped>
.year-header {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
}

.year-view {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.year-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: none;
  width: 100%;
}

.month {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
}

.month-header {
  font-size: 18px;
  text-align: center;
  margin-bottom: 10px;
  width: 90%;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  width: 85%;
}

.day-name {
  font-weight: bold;
  text-align: center;
}

.day {
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
}

.highlight {
  background-color: #ffecb3 !important;
  border-radius: 50% !important;
  font-weight: bold !important;
  color: red !important;
}
</style>
