import React from 'react'

const TransactionFilters = ({
  filters,
  searchValue,
  categoryOptions,
  categoryLabel,
  allLabel,
  searchLabel,
  onSearchChange,
  onFilterChange,
  onClear,
}) => {
  const hasFilters = searchValue !== "" || Object.values(filters).some((value) => value !== "");

  return (
    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      <div>
        <label className="text-[13px] text-slate-800">{searchLabel}</label>
        <input
          type="search"
          className="input-box"
          placeholder={searchLabel}
          value={searchValue}
          onChange={({target}) => onSearchChange(target.value)}
        />
      </div>
      <div>
        <label className="text-[13px] text-slate-800">{categoryLabel}</label>
        <select
          className="input-box"
          value={filters.category}
          onChange={({target}) => onFilterChange("category", target.value)}
        >
          <option value="">{allLabel}</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[13px] text-slate-800">From</label>
          <input
            type="date"
            className="input-box"
            value={filters.from}
            onChange={({target}) => onFilterChange("from", target.value)}
          />
        </div>
        <div>
          <label className="text-[13px] text-slate-800">To</label>
          <input
            type="date"
            className="input-box"
            value={filters.to}
            onChange={({target}) => onFilterChange("to", target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[13px] text-slate-800">Min amount</label>
          <input
            type="number"
            min="0"
            className="input-box"
            value={filters.minAmount}
            onChange={({target}) => onFilterChange("minAmount", target.value)}
          />
        </div>
        <div>
          <label className="text-[13px] text-slate-800">Max amount</label>
          <input
            type="number"
            min="0"
            className="input-box"
            value={filters.maxAmount}
            onChange={({target}) => onFilterChange("maxAmount", target.value)}
          />
        </div>
      </div>
      {hasFilters && (
        <div className="flex items-end">
          <button type="button" className="card-btn" onClick={onClear}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}

export default TransactionFilters
