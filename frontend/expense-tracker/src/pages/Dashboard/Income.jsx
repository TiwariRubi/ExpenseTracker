import React, {useEffect, useRef, useState} from 'react'
import toast from 'react-hot-toast'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import IncomeOverview from '../../components/Income/IncomeOverview';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import Modal from '../../components/Modal';
import AddIncomeForm from '../../components/Income/AddIncomeForm';
import { useUserAuth } from '../../hooks/useUserAuth';
import IncomeList from '../../components/Income/IncomeList';
import DeleteAlert from '../../components/DeleteAlert';
const Income = () => {
  useUserAuth();

    const [incomeData, setIncomeData]= useState([]);
    const [loading, setLoading] = useState(false);
    const [incomeSources, setIncomeSources] = useState([]);
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
    const searchTimer = useRef(null);
    const [openDeleteAlert, setOpenDeleteAlert]= useState({
      show: false,
      data: null,
    });
   
    const[openAddIncomeModal, setOpenAddIncomeModal]=useState(false);
    const [incomeToEdit, setIncomeToEdit] = useState(null);

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
      const controller = new AbortController();
      const fetchIncomeDetails = async () => {
        setLoading(true);

        try {
          const response = await axiosInstance.get(API_PATHS.INCOME.GET_ALL_INCOME, {
            params: filters,
            signal: controller.signal,
          });
          if (response.data) {
            setIncomeData(response.data);
            setIncomeSources((previousSources) =>
              [...new Set([...previousSources, ...response.data.map((income) => income.source)])]
                .sort((firstSource, secondSource) => firstSource.localeCompare(secondSource))
            );
          }
        } catch (error) {
          if (!controller.signal.aborted) {
            console.log("Something went wrong. Please try again.", error);
            toast.error(error.response?.data?.message || "Unable to filter income.");
          }
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      };

      fetchIncomeDetails();
      return () => controller.abort();
    }, [filters, refreshData]);

    // Handle Add Income
    const handleAddIncome = async (income) => {
       const {source, amount, date, icon, description }=income;

       //validation  checks
       if(!source.trim()){
        toast.error("Source is required.");
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
        const incomeDetails = {
          source,
          amount,
          date,
          icon,
          description,
        };
        if (incomeToEdit) {
          await axiosInstance.put(
            API_PATHS.INCOME.UPDATE_INCOME(incomeToEdit._id),
            incomeDetails
          );
        } else {
          await axiosInstance.post(API_PATHS.INCOME.ADD_INCOME, incomeDetails);
        }
        setOpenAddIncomeModal(false);
        setIncomeToEdit(null);
        setIncomeSources((previousSources) =>
          [...new Set([...previousSources, source])].sort((firstSource, secondSource) =>
            firstSource.localeCompare(secondSource)
          )
        );
        toast.success(incomeToEdit ? "Income updated successfully" : "Income added successfully");
        setRefreshData((previousValue) => previousValue + 1);
       }catch (error){
        console.error(
        incomeToEdit ? "Error updating income:" : "Error adding income:",
        error.response?.data?.message || error.message
       );
        toast.error(error.response?.data?.message || "Unable to save income.");
       }
    };

    const handleEditIncome = (income) => {
      setIncomeToEdit(income);
      setOpenAddIncomeModal(true);
    };

    const closeIncomeModal = () => {
      setOpenAddIncomeModal(false);
      setIncomeToEdit(null);
    };

    // Delete Income
    const deleteIncome = async(id) => {
      try{
        await axiosInstance.delete(API_PATHS.INCOME.DELETE_INCOME(id));
        setOpenDeleteAlert({show: false, data:null});
        toast.success("Income details deleted successfully");
        setRefreshData((previousValue) => previousValue + 1);
      }catch(error){
        console.error(
          "Error deleting income:",
          error.response?.data?.message || error.message
        );
      }
    };

    // handle download income details
    const handleDownloadIncomeDetails = async () => {
  try{
        const response=await axiosInstance.get(
          API_PATHS.INCOME.DOWNLOAD_INCOME,
          {
            responseType:"blob",
          }
        );
        // create a url for the blob
        const url= window.URL.createObjectURL(new Blob([response.data]))
        const link=document.createElement("a");
        link.href=url;
        link.setAttribute("download","income_details.xlsx");
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      }catch(error){
        console.error("Error downloading income details:", error);
        toast.error("Failed to download income details. Please try again")
      }
    };

  return (
   <DashboardLayout activeMenu="Income">
    <div className="my-5 mx-auto">
      <div className="grid grid-cols-1 gap-6">
        <div className="" >
          <IncomeOverview
            transactions={incomeData}    
            onAddIncome={()=>{
              setIncomeToEdit(null);
              setOpenAddIncomeModal(true);
            }}

          />

        </div>
          <IncomeList
            transactions={incomeData}
            loading={loading}
            filters={filters}
            searchValue={searchValue}
            categoryOptions={incomeSources}
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            onDelete ={(id)=>{
              setOpenDeleteAlert({
                show: true, data:id
              });
            }}
            onEdit={handleEditIncome}
             onDownload={handleDownloadIncomeDetails}
          />
      </div>
        <Modal
          isOpen={openAddIncomeModal}
          onClose={closeIncomeModal}
          title={incomeToEdit ? "Edit Income" : "Add Income"}
        >
      
      <AddIncomeForm onAddIncome={handleAddIncome} incomeToEdit={incomeToEdit} />

        </Modal>
        <Modal
         isOpen={openDeleteAlert.show}
         onClose={()=> setOpenDeleteAlert({show:false, data:null})}
         title="Delete Income"
         
        >
         <DeleteAlert
          content="Are you sure you want to delete this income detail??"
          onDelete={()=> deleteIncome(openDeleteAlert.data)}
         />
        </Modal>
    </div>

   </DashboardLayout>
  )
}

export default Income