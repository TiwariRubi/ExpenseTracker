import React from 'react'
import { LuDownload } from 'react-icons/lu'
import TransactionFilters from '../TransactionFilters'
import TransactionInfoCard from '../Cards/TransactionInfoCard'
import moment from 'moment'
import { getCategoryLabel } from '../../../../../shared/categoryHelpers.mjs'
const ExpenseList = ({
  transactions,
  loading,
  filters,
  searchValue,
  categoryOptions,
  onSearchChange,
  onFilterChange,
  onClearFilters,
  onDelete,
  onEdit,
  onDownload,
}) => {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h5 className="text-lg">All Expenses</h5>
           <button className="card-btn" onClick={onDownload}>
            <LuDownload className="text-base" />Download

           </button>
      </div>
      <TransactionFilters
        filters={filters}
        searchValue={searchValue}
        categoryOptions={categoryOptions}
        categoryLabel="Category"
        allLabel="All categories"
        searchLabel="Search category or description"
        onSearchChange={onSearchChange}
        onFilterChange={onFilterChange}
        onClear={onClearFilters}
      />
      {loading && <p className="mt-3 text-sm text-gray-400">Loading expenses...</p>}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {transactions?.map((expense)=>(
          <TransactionInfoCard
           key={expense._id}
           title={getCategoryLabel(expense)}
           description={expense.description}
           icon={expense.icon}
           date={moment(expense.date).format("Do MMM YYYY")}
           amount={expense.amount}
           type="expense"
           onEdit={()=> onEdit(expense)}
           onDelete={()=> onDelete(expense._id)}
          />
       ) )}
      </div>
    </div>
  )
}

export default ExpenseList