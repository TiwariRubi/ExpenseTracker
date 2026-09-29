import React from 'react';
import CustomPieChart from '../../components/Charts/CustomPieChart';
import { addThousandsSeparator } from '../../utils/helper';

const COLORS = ['#875CF5', '#FF6900', '#FA2C37', '#0F766E', '#2563EB'];

const Last60DaysIncome = ({ transactions = [] }) => {
  const totalsBySource = transactions.reduce((totals, transaction) => {
    const source = transaction.source || 'Other';
    totals[source] = (totals[source] || 0) + Number(transaction.amount || 0);
    return totals;
  }, {});

  const chartData = Object.entries(totalsBySource).map(([name, amount]) => ({
    name,
    amount,
  }));
  const totalIncome = chartData.reduce((total, item) => total + item.amount, 0);

  return (
    <div className="card">
      <h5 className="text-lg">Last 60 Days Income</h5>
      {chartData.length > 0 ? (
        <CustomPieChart
          data={chartData}
          label="Income"
          totalAmount={`$${addThousandsSeparator(totalIncome)}`}
          colors={COLORS}
          showTextAnchor
        />
      ) : (
        <p className="py-12 text-center text-sm text-gray-500">
          No income recorded in the last 60 days.
        </p>
      )}
    </div>
  );
};

export default Last60DaysIncome;