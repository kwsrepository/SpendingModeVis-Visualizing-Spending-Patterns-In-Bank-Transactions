<template>
  <div class="average-day">
    <h2>Average Day Analysis</h2>
    <p>Average number of transactions per day: {{ averageTransactions }}</p>
    <p>Average number of different subCategories per day: {{ averageSubCategories }}</p>
    <p>Average Amount per Transaction: {{ averageTransactionAmount.toFixed(2) }}</p>
    <p>Average Amount per Day: {{ averageDailyAmount.toFixed(2) }}</p>

  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'AverageDay',
  props: {
    data: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    // console.log("data:", props.data);

    // 按日期分组数据
    const groupedData = computed(() => {
      const groups = new Map();
      props.data.forEach(transaction => {
        const date = transaction["Transaction Date"];
        if (!groups.has(date)) {
          groups.set(date, []);
        }
        groups.get(date).push(transaction);
      });
      return groups;
    });

    // 计算每天的交易数量和subCategory的数量
    const dailyMetrics = computed(() => {
      const dailyCounts = [];
      groupedData.value.forEach((transactions) => {
        const transactionCount = transactions.length;
        const subCategoryCount = new Set(transactions.map(t => t.subCategory)).size;
        dailyCounts.push({ transactionCount, subCategoryCount });
      });
      return dailyCounts;
    });

    // 计算平均交易数和平均subCategory数
    const averageTransactions = computed(() => {
      const totalTransactions = dailyMetrics.value.reduce((sum, day) => sum + day.transactionCount, 0);
      // console.log("number of transactions:", totalTransactions);
      // console.log("number of date have transaction:", dailyMetrics.value.length);
      return (totalTransactions / dailyMetrics.value.length).toFixed(2);
    });

    const averageSubCategories = computed(() => {
      const totalSubCategories = dailyMetrics.value.reduce((sum, day) => sum + day.subCategoryCount, 0);
      return (totalSubCategories / dailyMetrics.value.length).toFixed(2);
    });

    const averageTransactionAmount = computed(() => {
      const totalAmount = props.data.reduce((sum, transaction) => {
        return sum + (transaction["Debit Amount"] || 0) + (transaction["Credit Amount"] || 0);
      }, 0);
      return totalAmount / props.data.length;
    });

    const averageDailyAmount = computed(() => {
      let totalDailyAmount = 0;
      groupedData.value.forEach(transactions => {
        const dailyTotal = transactions.reduce((sum, transaction) => {
          return sum + (transaction["Debit Amount"] || 0) + (transaction["Credit Amount"] || 0);
        }, 0);
        totalDailyAmount += dailyTotal;
      });
      return totalDailyAmount / groupedData.value.size;
    });

    return {
      averageTransactions,
      averageSubCategories,
      averageTransactionAmount,
      averageDailyAmount,
    };
  },
};
</script>

<style scoped>
.average-day {
  padding: 20px;
}

h2 {
  margin-bottom: 10px;
}

p {
  font-size: 16px;
  margin: 5px 0;
}
</style>
