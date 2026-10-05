import React from 'react'
import expenseCategories from '../../../../../shared/expenseCategories.json'
import { getCategoryLabel } from '../../../../../shared/categoryHelpers.mjs'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const CustomBarChart = ({data}) => {
  // function to alternate colors
   const getBarColor=(category, index) =>{
    const expenseCategory = expenseCategories.find((item) => item.name === category);
    return expenseCategory ? expenseCategory.color : index%2===0 ? "#875cf5" : "#cfbefb";
   };
   const CustomTooltip =({active, payload})=>{
    if(active && payload && payload.length){
      const expenseCategory = expenseCategories.find(
        (category) => category.name === payload[0].payload.categoryType
      );
      return (
        <div className="bg-white shadow-md rounded-lg p-2 border border-gray-300">
          {expenseCategory && (
            <p className="text-xs font-semibold text-purple-800 mb-1">
              {expenseCategory.icon} {getCategoryLabel(payload[0].payload)}
            </p>
          )}
          <p className="text-sm text-gray-600">
            Amount: <span className="text-sm font-medium text-gray-900">₹{payload[0].payload.amount}</span>
          </p>
        </div>
      );
    }
    return null;
   };
  return (
    <div className="bg-white mt-6">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid stroke="none" />
          <XAxis dataKey="category" tick={{fontSize: 12, fill:"#555" }} stroke="none" />
          <YAxis tick={{fontSize: 12, fill: "#555"}} stroke="none" />
          <Tooltip content={CustomTooltip} />
          <Bar
            dataKey="amount"
            fill="#FF8042"
            radius={[8, 8, 0, 0]}
            activeStyle={{fill: "green"}}
          >
            {data.map((entry, index)=>(
              <Cell key={index} fill={getBarColor(entry.categoryType, index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CustomBarChart