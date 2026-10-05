import React, {useState} from 'react'
import Input from '../Inputs/Input'
import EmojiPickerPopup from '../EmojiPickerPopup'
import expenseCategories from '../../../../../shared/expenseCategories.json'
import { getCategoryLabel } from '../../../../../shared/categoryHelpers.mjs'
const AddExpenseForm = ({onAddExpense, expenseToEdit, customCategories = []}) => {
  const existingCategoryLabel = getCategoryLabel(expenseToEdit);
  const [income, setIncome]=useState(() => expenseToEdit ? {
    category: expenseToEdit.category,
    customCategory: expenseToEdit.category === "Other"
      ? expenseToEdit.customCategory || (existingCategoryLabel !== "Other" ? existingCategoryLabel : "")
      : "",
    amount: expenseToEdit.amount,
    date: new Date(expenseToEdit.date).toISOString().split("T")[0],
    icon: expenseToEdit.icon || "",
    description: expenseToEdit.description || "",
  } : {
    category: "",
    customCategory: "",
    amount: "",
    date: "",
    icon: "",
    description: "",
  });
  const handleChange=(key, value) => setIncome({...income, [key]:value});
  const handleCategoryChange = (category) => setIncome({
    ...income,
    category,
    customCategory: category === "Other" ? income.customCategory : "",
  });
  return <div>
    <EmojiPickerPopup
    icon={income.icon}
    onSelect={(selectedIcon) => handleChange("icon", selectedIcon)}
    />
    <label className="text-[13px] text-slate-800">Category</label>
    <select
      className="input-box"
      value={income.category}
      onChange={({target}) => handleCategoryChange(target.value)}
    >
      <option value="" disabled>Select a category</option>
      {expenseCategories.map((category) => (
        <option key={category.name} value={category.name}>
          {category.icon} {category.name}
        </option>
      ))}
    </select>
    {income.category === "Other" && (
      <>
      <Input
        value={income.customCategory}
        onChange={({target}) => handleChange("customCategory", target.value.slice(0, 30))}
        label="Enter your category"
        placeholder="e.g. Trip To Goa"
        type="text"
        list="custom-expense-categories"
      />
      <datalist id="custom-expense-categories">
        {customCategories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>
      </>
    )}
    <Input
      value={income.description}
      onChange={({target}) => handleChange("description", target.value.slice(0, 100))}
      label="Description"
      placeholder="Optional details"
      type="text"
    />
    <p className="text-xs text-gray-400 -mt-3 mb-4 text-right">
      {income.description.length}/100
    </p>
    <Input
      value={income.amount}
      onChange={({target})=> handleChange("amount",target.value)}
      label="Amount"
      placeholder=""
      type="number"
    />
    <Input
      value={income.date}
      onChange={({target})=> handleChange("date",target.value)}
      label="Date"
      placeholder=""
      type="date"
    />
    <div className="flex justify-end mt-6">
      <button
        type="button"
        className="add-btn add-btn-fill"
        onClick={()=>onAddExpense(income)}
        >
          {expenseToEdit ? "Update" : "Add Expense"}
      </button>
       </div>
  </div>
}

export default AddExpenseForm