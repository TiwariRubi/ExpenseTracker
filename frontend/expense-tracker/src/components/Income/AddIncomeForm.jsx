import React,{useState} from 'react'
import Input from '../Inputs/Input';
import EmojiPickerPopup from '../EmojiPickerPopup';

const AddIncomeForm = ({onAddIncome, incomeToEdit}) => {
     const [income, setIncome] = useState(() => incomeToEdit ? {
      source: incomeToEdit.source,
      amount: incomeToEdit.amount,
      date: new Date(incomeToEdit.date).toISOString().split("T")[0],
      icon: incomeToEdit.icon || "",
      description: incomeToEdit.description || "",
     } : {
      source:"",
      amount:"",
      date:"",
      icon:"",
      description:"",
     });
     const handleChange =(key, value) => setIncome({...income, [key]: value});
  return (
   <div>
      <EmojiPickerPopup
       icon ={income.icon}
       onSelect={(selectedIcon) => handleChange("icon", selectedIcon)}
      />
      
      <Input
         value={income.source}
         onChange={({ target }) => handleChange("source", target.value)}
         label="Income Source"
         placeholder="Freelance, Salary, etc"
         type="text"
      />
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
        onChange={({target})=> handleChange("amount", target.value)}
        label="Amount"
        placeholder=""
        type="number"
      />
      <Input
        value={income.date}
        onChange={({target}) => handleChange("date", target.value)}
        label="Date"
        placeholder=""
        type="date"
      />
      <div className="flex justify-end mt-6">
        <button 
          type="button"
          className="add-btn add-btn-fill"
          onClick={() => onAddIncome(income)}
        >
         {incomeToEdit ? "Update" : "Add Income"}
        </button>

      </div>
   </div>
  )
}

export default AddIncomeForm