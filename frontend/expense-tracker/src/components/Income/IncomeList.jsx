import React from 'react'
import TransactionInfoCard from '../Cards/TransactionInfoCard'
import moment from 'moment'
import { LuDownload } from 'react-icons/lu'
import TransactionFilters from '../TransactionFilters'
import { formatIncomeSourceLabel } from '../../utils/helper'
const IncomeList = ({
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
        <h5 className="text-lg">Income Sources</h5>
        <button className="card-btn" onClick={onDownload}>
          <LuDownload className="text-base" />Download
        </button>
      </div> 
      <TransactionFilters
        filters={filters}
        searchValue={searchValue}
        categoryOptions={categoryOptions}
        categoryLabel="Source"
        allLabel="All sources"
        searchLabel="Search source or description"
        onSearchChange={onSearchChange}
        onFilterChange={onFilterChange}
        onClear={onClearFilters}
      />
      {loading && <p className="mt-3 text-sm text-gray-400">Loading income...</p>}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {transactions?.map((income) =>(
          <TransactionInfoCard
          key={income._id}
          title={formatIncomeSourceLabel(income.source)}
          description={income.description}
          icon={income.icon}
          date={moment(income.date).format("Do MMM YYYY")}
          amount={income.amount}
          type="income"
          onEdit={()=> onEdit(income)}
          onDelete={()=> onDelete(income._id)}
          />
        ))}

      </div>
      <div>

      </div>
    </div>
  )
}

export default IncomeList