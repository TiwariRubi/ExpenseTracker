import React, {useState, useEffect, useRef} from 'react'
import toast from 'react-hot-toast'
import { useUserAuth } from '../../hooks/useUserAuth'
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ExpenseOverview from '../../components/Expense/ExpenseOverview';
import AddExpenseForm from '../../components/Expense/AddExpenseForm';
import ExpenseList from '../../components/Expense/ExpenseList';
import DeleteAlert from '../../components/DeleteAlert';
import Modal from '../../components/Modal';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import expenseCategories from '../../../../../shared/expenseCategories.json';
const Expense = () => {
  useUserAuth();

   const [expenseData, setExpenseData]= useState([]);
      const [loading, setLoading] = useState(false);
      const [filters, setFilters] = useState({
        search: "",
        category: "",
        from: "",
        to: "",
        minAmount: "",
        maxAmount: "",
      });
      const [searchValue, setSearchValue] = useState("");
      const [refreshData, setRefreshData] = useState(0);
      const [customCategories, setCustomCategories] = useState([]);
      const searchTimer = useRef(null);
      const [openDeleteAlert, setOpenDeleteAlert]= useState({
        show: false,
        data: null,
      });

      const[openAddExpenseModal, setOpenAddExpenseModal]=useState(false);
      const [expenseToEdit, setExpenseToEdit] = useState(null);

      const showBudgetWarning = (budgetStatus) => {
        const statuses = Array.isArray(budgetStatus)
          ? budgetStatus
          : budgetStatus
            ? [budgetStatus]
            : [];
        const warnings = statuses.filter((status) =>
          ["warning", "exceeded"].includes(status.level)
        );
        if (!warnings.length) return;

        const message = warnings.map((status) =>
          `${status.label || status.customCategory || status.category} is at ${Math.round(status.percentUsed)}% of its budget`
        ).join("; ");

        toast(message, {
          icon: warnings.some((status) => status.level === "exceeded") ? "🚨" : "⚠️",
          style: {
            fontSize: "15px",
            fontWeight: 600,
            padding: "14px 18px",
            border: "1px solid #f59e0b",
            color: "#78350f",
          },
        });
      };

    const handleSearchChange = (value) => {
      setSearchValue(value);
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => {
        setFilters((previousFilters) => ({ ...previousFilters, search: value }));
      }, 300);
    };

    const handleFilterChange = (key, value) => {
      setFilters((previousFilters) => ({ ...previousFilters, [key]: value }));
    };

    const clearFilters = () => {
      clearTimeout(searchTimer.current);
      setSearchValue("");
      setFilters({ search: "", category: "", from: "", to: "", minAmount: "", maxAmount: "" });
    };

    useEffect(() => () => clearTimeout(searchTimer.current), []);

    useEffect(() => {
      if (!openAddExpenseModal) return;

      const controller = new AbortController();
      const fetchCustomCategories = async () => {
        try {
          const response = await axiosInstance.get(
            API_PATHS.EXPENSE.GET_CUSTOM_EXPENSE_CATEGORIES,
            { signal: controller.signal }
          );
          if (!Array.isArray(response.data)) {
            throw new Error("Invalid custom category response");
          }
          setCustomCategories(response.data);
        } catch (error) {
          if (!controller.signal.aborted) {
            console.error(
              "Error fetching custom expense categories:",
              error.response?.data?.message || error.message
            );
            toast.error(error.response?.data?.message || "Unable to load custom categories.");
          }
        }
      };

      fetchCustomCategories();
      return () => controller.abort();
    }, [openAddExpenseModal]);

    useEffect(() => {
      const controller = new AbortController();
      const fetchExpenseDetails = async () => {
        setLoading(true);

        try {
          const response = await axiosInstance.get(API_PATHS.EXPENSE.GET_ALL_EXPENSE, {
            params: filters,
            signal: controller.signal,
          });
          if (response.data) {
            setExpenseData(response.data);
          }
        } catch (error) {
          if (!controller.signal.aborted) {
            console.log("Something went wrong. Please try again.", error);
            toast.error(error.response?.data?.message || "Unable to filter expenses.");
          }
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      };

      fetchExpenseDetails();
      return () => controller.abort();
    }, [filters, refreshData]);

    // Handle Add Expense
    const handleAddExpense = async (expense) => {
       const {category, customCategory, amount, date, icon, description }=expense;

       //validation  checks
       if(!category.trim()){
        toast.error("Category is required.");
        return;
       }
       if(category === "Other" && !customCategory.trim()){
        toast.error("Enter your category.");
        return;
       }
       if(!amount || isNaN(amount) || Number(amount) <= 0){
        toast.error("Amount should be valid number greater than 0.")
        return;
       }
       if(!date){
        toast.error("Date is required.");
        return;
       }
       try{
        const expenseDetails = {
          category,
          customCategory,
          amount,
          date,
          icon,
          description,
        };
        let response;
        if (expenseToEdit) {
          response = await axiosInstance.put(
            API_PATHS.EXPENSE.UPDATE_EXPENSE(expenseToEdit._id),
            expenseDetails
          );
        } else {
          response = await axiosInstance.post(API_PATHS.EXPENSE.ADD_EXPENSE, expenseDetails);
        }
        showBudgetWarning(response.data?.budgetStatus);
        setOpenAddExpenseModal(false);
        setExpenseToEdit(null);
        toast.success(expenseToEdit ? "Expense updated successfully" : "Expense added successfully");
        setRefreshData((previousValue) => previousValue + 1);
       }catch (error){
        console.error(
        expenseToEdit ? "Error updating expense:" : "Error adding expense:",
        error.response?.data?.message || error.message
       );
        toast.error(error.response?.data?.message || "Unable to save expense.");
       }
    };

    const handleEditExpense = (expense) => {
      setExpenseToEdit(expense);
      setOpenAddExpenseModal(true);
    };

    const closeExpenseModal = () => {
      setOpenAddExpenseModal(false);
      setExpenseToEdit(null);
    };

     // Delete Expense
    const deleteExpense = async(id) => {
      try{
         const response = await axiosInstance.delete(API_PATHS.EXPENSE.DELETE_EXPENSE(id));
         showBudgetWarning(response.data?.budgetStatus);
        setOpenDeleteAlert({show: false, data:null});
        toast.success("Expense details deleted successfully");
        setRefreshData((previousValue) => previousValue + 1);
      }catch(error){
        console.error(
          "Error deleting expense:",
          error.response?.data?.message || error.message
        );
        toast.error(error.response?.data?.message || "Unable to delete expense.");
      }
    };

      // handle download expense details
    const handleDownloadExpenseDetails = async () => {
      try{
        const response=await axiosInstance.get(
          API_PATHS.EXPENSE.DOWNLOAD_EXPENSE,
          {
            responseType:"blob",
          }
        );
        // create a url for the blob
        const url= window.URL.createObjectURL(new Blob([response.data]))
        const link=document.createElement("a");
        link.href=url;
        link.setAttribute("download","expense_details.xlsx");
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      }catch(error){
        console.error("Error downloading expense details:", error);
        toast.error("Failed to download expense details. Please try again")
      }
    };

  return (
  <DashboardLayout activeMenu="Expense">
    <div className="my-5 mx-auto">
      <div className="grid grid-cols-1 gap-6">
       <div className="">
        <ExpenseOverview
         transactions={expenseData}
         onExpenseIncome={()=>{
          setExpenseToEdit(null);
          setOpenAddExpenseModal(true);
         }}
        />
       </div>
       <ExpenseList
         transactions={expenseData}
       loading={loading}
        filters={filters}
        searchValue={searchValue}
        categoryOptions={expenseCategories.map((category) => category.name)}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        onDelete={(id)=>{
          setOpenDeleteAlert({show:true,data:id});
        }}
        onEdit={handleEditExpense}
        onDownload={handleDownloadExpenseDetails}
       />

      </div>
      <Modal
       isOpen={openAddExpenseModal}
       onClose={closeExpenseModal}
       title={expenseToEdit ? "Edit Expense" : "Add Expense"}
      >
        <AddExpenseForm
          onAddExpense={handleAddExpense}
          expenseToEdit={expenseToEdit}
          customCategories={customCategories}
        />

      </Modal>
       <Modal
         isOpen={openDeleteAlert.show}
         onClose={()=> setOpenDeleteAlert({show:false, data:null})}
         title="Delete Expense"
         
        >
         <DeleteAlert
          content="Are you sure you want to delete this expense detail??"
          onDelete={()=> deleteExpense(openDeleteAlert.data)}
         />
        </Modal>
    </div>
  </DashboardLayout>
  )
}

export default Expense