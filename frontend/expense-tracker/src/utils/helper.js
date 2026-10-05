import moment from 'moment';
import { getCategoryLabel } from '../../../../shared/categoryHelpers.mjs';

export const validateEmail=(email)=>{
  const regex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const getInitials =(name) =>{
  if(!name) return "" ;
  const words= name.split(" ");
  let initials= "";

  for (let i=0; i< Math.min(words.length, 2); i++){
    initials += words[i][0];
  }

  return initials.toUpperCase();
};

export const addThousandsSeparator=(num)=>{
  if(num== null || isNaN(num) )return "" ;

  const [integerPart, fractionalPart] = num.toString().split(".");
  const formattedInteger= integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return fractionalPart
  ? `${formattedInteger}.${fractionalPart}`
  : formattedInteger;
};

export const prepareExpenseBarChartData =(data=[])=>{
  const categoryTotals = new Map();

  data.forEach((item) => {
    const categoryLabel = getCategoryLabel(item);
    const categoryKey = categoryLabel.toLocaleLowerCase();
    const existingCategory = categoryTotals.get(categoryKey);

    if (existingCategory) {
      existingCategory.amount += item?.amount || 0;
    } else {
      categoryTotals.set(categoryKey, {
        category: categoryLabel,
        categoryType: item?.category,
        customCategory: item?.customCategory || "",
        amount: item?.amount || 0,
      });
    }
  });

  return [...categoryTotals.values()];
};

export const prepareIncomeBarChartData = (data=[]) =>{
  const sortedData =[...data].sort((a,b) => new Date(a.date) - new Date(b.date));

  const chartData = sortedData.map((item) => {
    const incomeDate = new Date(item?.date);

    return {
      category: Number.isNaN(incomeDate.getTime())
        ? ""
        : moment(incomeDate).utc().format("Do MMM"),
      amount: item?.amount,
    };
  });
  return chartData;
};

export const formatIncomeSourceLabel = (source = "") =>
  source
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase())
    .join(" ");

export const prepareIncomeSourceChartData = (data = []) => {
  const sourceTotals = new Map();

  data.forEach((item) => {
    const source = formatIncomeSourceLabel(item?.source || "");
    if (!source) return;

    const sourceKey = source.toLocaleLowerCase();
    const existingSource = sourceTotals.get(sourceKey);

    if (existingSource) {
      existingSource.amount += item?.amount || 0;
    } else {
      sourceTotals.set(sourceKey, {
        name: source,
        amount: item?.amount || 0,
      });
    }
  });

  return [...sourceTotals.values()];
};

export const prepareExpenseLineChartData =(data = []) => {
  const sortedData =[...data].sort((a,b)=> new Date(a.date)  - new Date(b.date));
  const chartData = sortedData.map((item)=>({
    month: moment(item?.date).format('Do MMM'),
    amount: item?.amount,
    category: getCategoryLabel(item),
    categoryType: item?.category,
  }));
  return chartData;
}