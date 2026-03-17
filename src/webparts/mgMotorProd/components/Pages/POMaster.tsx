import * as React from "react";
import { useState, useEffect, useRef } from "react";
import type { IMgMotorProdProps } from "../IMgMotorProdProps";
import SPCRUDOPS from "../../service/DAL/spcrudops";
import { useHistory } from 'react-router-dom';
import "../Pages/CSS/NewRequest.scss";
import * as XLSX from 'xlsx';
import RORequestsOps from "../../service/BAL/SPCRUD/RO";
import ReleaseOrderRequestsOps from "../../service/BAL/SPCRUD/ReleaseOrder";
import { formatAmount } from "../../service/BAL/SPCRUD/Helper";
import VendorRequestsOps from "../../service/BAL/SPCRUD/VendorMaster";
import { sp } from "@pnp/sp";

export const POMaster: React.FC<IMgMotorProdProps> = (props: IMgMotorProdProps) => {

  const [searchTerm, setSearchTerm] = useState("");
  const [ROData, setROData] = useState<any[]>([]);
  const [PRData, setPRData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [popupVisible, setPopupVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [MovementDropdown, setMovementDropdown] = useState<any[]>([]);
  const [recordsPerPage, setRecordsPerPage] = useState(10); // default 10 records per page
  const [originalVendorCode, setOriginalVendorCode] = useState("");
  const [vendors, setVendors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [filteredCostCenters, setFilteredCostCenters] = useState<any[]>([]);
  const [filterInputs, setFilterInputs] = useState({
      ageing: "",
      movementType: "",
      approvalNoteYear: "",
  });

  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [vendorForm, setVendorForm] = useState({
      VendorName: "",
      VendorCode: "",
      Department: "",
      CostCenter: "",
      RefPRNo: "",
      BudgetLineItem: "",
      PONumber: "",
      POAmount: "",
      POBalanceAmount: "",
      PODate: "",
      POStartDate: "",
      POEndDate: ""
  });

  const [columnFilters, setColumnFilters] = useState({
      VendorName: "",
      VendorCode: "",
      Department: "",
      CostCenter: "",
      RefPRNo: "",
      BudgetLineItem: "",
      PONumber: "",
      POAmount: "",
      POBalanceAmount: "",
      PODate: "",
      POStartDate: "",
      POEndDate: ""
  });

  const resetFilters = () => {
      setColumnFilters({
          VendorName: "",
          VendorCode: "",
          Department: "",
          CostCenter: "",
          RefPRNo: "",
          BudgetLineItem: "",
          PONumber: "",
          POAmount: "",
          POBalanceAmount: "",
          PODate: "",
          POStartDate: "",
          POEndDate: ""
      });
      setSearchTerm("");
      //setFilterInputs({ ageing: "", movementType: "", approvalNoteYear: "" });
  };
  // Smooth‑scroll anchor
  const pageTopRef = useRef<HTMLDivElement | null>(null);
  const itemsPerPage = recordsPerPage;

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const history = useHistory();

  const handleTitleClick = (id) => {
      // Save dashboard state to sessionStorage
      sessionStorage.setItem(
          'dashboardState',
          JSON.stringify({
              searchTerm,
              columnFilters,
              currentPage,
              filterInputs,
          })
      );

      sessionStorage.setItem('sidebarFrom', '/AllReqDash');
      
      history.push({ pathname: '/ApprovalForm', search: `?ItemId=${id}&from=AllReqDash`});
  };


  const dateDifference = (fromDt: Date, toDt: Date) => {
      const diff = new Date(toDt.getTime() - fromDt.getTime());
      const days = diff.getTime() / 1000 / 60 / 60 / 24;
      return days.toFixed(0);
  };

  const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB'); // dd/mm/yyyy
  };

  const GetROData = async () => {
      let employeeProfile = await EmployeeProfile(props.userEmail);
      setLoading(true);
      const ROColl = await ReleaseOrderRequestsOps().getPOData(
          { column: "ID", isAscending: false },
          props,
          ''
      );
      // RO Amount Tracking
      const roAmt = await ReleaseOrderRequestsOps().getROAmountTracking(
        { column: "ID", isAscending: true },
        props,
        ''
      );
      console.log('PO data: ', ROColl);// Debug log
      // Create RO amount map
      const roMap: any = {};

      roAmt.forEach((ro: any) => {
        if (ro.Title !== "Active") return; // match jQuery filter
        const poNo = ro.PONumber?.trim();
        if (!roMap[poNo]) {
          roMap[poNo] = 0;
        }
        roMap[poNo] += Number(ro.Amount || 0);
      });

      // Calculate PO Balance
      const updatedPO = ROColl.map((po: any) => {
        const poNo = po.PONumber?.trim();
        const usedAmount = roMap[poNo] || 0;
        return {
          ...po,
          POBalanceAmount: Number(po.POAmount || 0) - usedAmount
        };

      });
      setROData(updatedPO);
      setFilteredData(updatedPO);
      setLoading(false);
  };

  const getLookupData = async () => {
    // Departments
    const deptData = await VendorRequestsOps().getDepartmentData(
      { column: "Title", isAscending: true },
      props,
      ''
    );
    const deptList = [...new Set(deptData.map(d => d.Title))];

    setDepartments(deptList);

    // Cost Centers
    const ccData = await VendorRequestsOps().getCostCenterData(
      { column: "Title", isAscending: true },
      props,
      ''
    );
    setCostCenters(ccData);

    // Vendors
    const vendorData = await VendorRequestsOps().getIVendorMasterData(
      { column: "Title", isAscending: true },
      props,
      ''
    );
    setVendors(vendorData);
  };

  const handleGetPRData = async () => {
      if (!vendorForm.PONumber) {
          alert('Please enter a PONumber');
          return;
      }
      const IPRColl = await VendorRequestsOps().getIPRMasterData(
          { column: "ID", isAscending: false },
          props,
          `PONumber eq '${vendorForm.PONumber}'`
      );
      if (IPRColl.length !== 0) {
          setVendorForm(prev => ({
              ...prev,
              RefPRNo: IPRColl[0].PRNumber,
              BudgetLineItem: IPRColl[0].BudgetLineItem
          }));
      } 
      if (IPRColl.length === 0) {
          alert('No matching PR and Budget Line Item found for this PONumber');
      }
      setPRData(IPRColl);
  };

  useEffect(() => {
      GetROData();
      getLookupData();
  }, []);

  useEffect(() => {
      if (ROData.length > 0) {
          const savedState = sessionStorage.getItem('dashboardState');
          if (savedState) {
              const saved = JSON.parse(savedState);
              setSearchTerm(saved.searchTerm || '');   // ✅ use saved.searchTerm
              setColumnFilters(saved.columnFilters || {});
              setCurrentPage(saved.currentPage || 1);
              setFilterInputs(saved.filterInputs || {});
              //applyAdvancedFiltersPageload(saved.filterInputs || {});
              sessionStorage.removeItem('dashboardState'); // optional cleanup
          }
      }
  }, [ROData]);

  //Filter Search based on each column 
  useEffect(() => {
      let filtered = ROData;
      Object.keys(columnFilters).forEach((key) => {
          const value = columnFilters[key].toLowerCase();
          if (value) {
              filtered = filtered.filter((item) => {

                  if (!item[key]) return false;

                  if (key === "Created") {
                      return formatDate(item[key]).toLowerCase().includes(value);
                  }

                  return item[key].toString().toLowerCase().includes(value);
              });
          }
      });

      setFilteredData(filtered);
      setCurrentPage(1);
  }, [columnFilters]);

  //filter based on search
  useEffect(() => {
      if (!searchTerm) {
          setFilteredData(ROData);
      } else {
          const lowerSearch = searchTerm.toLowerCase();
          const filtered = ROData.filter(item =>
              (item.VendorName || '').toLowerCase().includes(lowerSearch) ||
              (item.VendorCode || '').toLowerCase().includes(lowerSearch) ||
              (item.Department || '').toLowerCase().includes(lowerSearch) ||
              (item.CostCenter || '').toLowerCase().includes(lowerSearch) ||
              (item.RefPRNo || '').toLowerCase().includes(lowerSearch) ||
              (item.BudgetLineItem || '').toLowerCase().includes(lowerSearch) ||
              (item.PONumber || '').toLowerCase().includes(lowerSearch) ||
              (item.POAmount || '').toString().toLowerCase().includes(lowerSearch) ||
              (item.POBalanceAmount || '').toString().toLowerCase().includes(lowerSearch) ||
              (item.PODate || '').toLowerCase().includes(lowerSearch) ||
              (item.POStartDate || '').toLowerCase().includes(lowerSearch) ||
              (item.POEndDate || '').toLowerCase().includes(lowerSearch) 
          );
          setFilteredData(filtered);
          setCurrentPage(1);
      }
  }, [searchTerm, ROData]);  // ✅ added ROData

  const handleColumnFilterChange = (key: string, value: string) => {
      setColumnFilters(prev => ({ ...prev, [key]: value }));
  };


  //List Data of User Master
  async function EmployeeProfile(Email: string) {
      const spCrudOps = await SPCRUDOPS();
      return spCrudOps.getRootData(
          'UserMaster',
          'EmployeeId,Id,FullName/Title,FullName/ID,FullName/EMail,DirectManagerName/Title,DirectManagerName/ID,DirectManagerName/EMail,OfficeCity/CompanyLocation,OfficeCity/ID,DepartmentCode/Department,DepartmentCode/ID',
          'FullName,DirectManagerName,OfficeCity,DepartmentCode',
          `FullName/EMail eq '${Email}'`,
          { column: 'ID', isAscending: true },
          props
      );
  }

  const handlePageChange = (page: number) => {
      if (page >= 1 && page <= totalPages) {
          setCurrentPage(page);
          /* Smooth scroll to top of table */
          pageTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  };

  const paginatedData = filteredData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  const exportToExcel = () => {
      // Always export all filtered data (ignore pagination)
      const dataToExport = filteredData;

      if (dataToExport.length === 0) {
          alert("No records found to export.");
          return;
      }

      // Map fields to clean column labels
      const exportData = dataToExport.map((item) => ({
          "Vendor Name": item.VendorName,
          "Vendor Code": item.VendorCode,
          "Department": item.Department,
          "Cost Center": item.CostCenter,
          "Ref.PR No": item.RefPRNo,
          "Budget Line Item": item.BudgetLineItem,
          "PO Number": item.PONumber,
          "Amount": item.POAmount,
          "Current Balance": item.POBalanceAmount,
          "Date": item.PODate,
          "Start Date": item.POStartDate,
          "End Date": item.POEndDate
      }));

      // Create sheet + workbook
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "AllRequests");

      // Save file with today’s date
      const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
      XLSX.writeFile(workbook, `RO_${today}.xlsx`);
  };

  const openAddPopup = () => {
  setIsEdit(false);
  setSelectedId(null);
  setVendorForm({
      VendorName: "",
      VendorCode: "",
      Department: "",
      CostCenter: "",
      RefPRNo: "",
      BudgetLineItem: "",
      PONumber: "",
      POAmount: "",
      POBalanceAmount: "",
      PODate: "",
      POStartDate: "",
      POEndDate: ""
  });
  setPopupVisible(true);
  };

  const openEditPopup = (item) => {
  setIsEdit(true);
  setSelectedId(item.ID);
  setOriginalVendorCode(item.VendorCode);
  setVendorForm({
      VendorName: item.VendorName,
      VendorCode: item.VendorCode,
      Department: item.Department,
      CostCenter: item.CostCenter,
      RefPRNo: item.RefPRNo,
      BudgetLineItem: item.BudgetLineItem,
      PONumber: item.PONumber,
      POAmount: item.POAmount,
      POBalanceAmount: item.POBalanceAmount,
      PODate: formatDateInput(item.PODate),
      POStartDate: formatDateInput(item.POStartDate),
      POEndDate: formatDateInput(item.POEndDate)
  });
  setPopupVisible(true);
  };

  const handleVendorChange = (e:any) => {
    const selectedVendor = vendors.find(
      v => v.Title === e.target.value
    );

    setVendorForm(prev => ({
      ...prev,
      VendorName: selectedVendor?.Title || "",
      VendorCode: selectedVendor?.VendorCode || ""
    }));
  };

  const handleDepartmentChange = (e:React.ChangeEvent<HTMLSelectElement>) => {
    const dept = e.target.value;
    const filtered = costCenters.filter(
      c => c.Department === dept
    );

    setFilteredCostCenters(filtered);
    setVendorForm(prev => ({
      ...prev,
      Department: dept,
      CostCenter: ""
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
  setVendorForm(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!vendorForm.VendorName.trim()) {
      alert("Vendor Name is required");
      return false;
    }

    if (!vendorForm.VendorCode.trim()) {
      alert("Vendor Code is required");
      return false;
    }

    if (!vendorForm.Department.trim()) {
      alert("Department is required");
      return false;
    }

    if (!vendorForm.CostCenter.trim()) {
      alert("Cost Center is required");
      return false;
    }

    if (!vendorForm.RefPRNo.trim()) {
      alert("Ref PR No is required");
      return false;
    }

    if (!vendorForm.BudgetLineItem.trim()) {
      alert("Budget Line Item is required");
      return false;
    }

    if (!vendorForm.PONumber.trim()) {
      alert("PO Number is required");
      return false;
    }

    if (!vendorForm.POAmount) {
      alert("PO Amount is required");
      return false;
    }

    if (!vendorForm.PODate) {
      alert("PO Date is required");
      return false;
    }

    if (!vendorForm.POStartDate) {
      alert("PO Start Date is required");
      return false;
    }

    if (!vendorForm.POEndDate) {
      alert("PO End Date is required");
      return false;
    }

    return true;
  };

  const update = async () => {
      const spCrudObj = await SPCRUDOPS();
      if (!validateForm()) return;
      setLoading(true);
      try {
          // 🔹 Check duplicate VendorCode
          if (!isEdit || vendorForm.VendorCode !== originalVendorCode) {
            const vendorData = await ReleaseOrderRequestsOps().getPOData(
                { column: "ID", isAscending: true },
                props,
                `VendorName eq '${vendorForm.VendorName}' 
                and VendorCode eq '${vendorForm.VendorCode}'
                and Department eq '${vendorForm.Department}'
                and CostCenter eq '${vendorForm.CostCenter}'
                and PONumber eq '${vendorForm.PONumber}'`
            );

            // 🔹 Ignore same record when editing
            const duplicateVendor = vendorData.filter(
                item => Number(item.ID) !== Number(selectedId)
            );

            if (duplicateVendor.length > 0) {
                alert("Vendor Code already exists!");
                setLoading(false);
                return;
            }
          } 
          const payload = {
            VendorName: vendorForm.VendorName,
            VendorCode: vendorForm.VendorCode,
            PONumber: vendorForm.PONumber,
            POAmount: vendorForm.POAmount,
            PODate: vendorForm.PODate,
            POStartDate: vendorForm.POStartDate,
            POEndDate: vendorForm.POEndDate,
            Department: vendorForm.Department,
            CostCenter: vendorForm.CostCenter,
            RefPRNo: vendorForm.RefPRNo,
            BudgetLineItem: vendorForm.BudgetLineItem
          };
          if (isEdit && selectedId) {
            await spCrudObj.updateData('PO_Master_List', selectedId, payload, props);
            alert("PO details updated successfully!");
          } else {
            await spCrudObj.insertData('PO_Master_List', payload, props);
            alert("PO details added successfully!");
          }

          setPopupVisible(false);
          GetROData(); // refresh grid
      } catch (err) {
          console.error(err);
          alert("Error saving vendor");
      } finally {
          setLoading(false); 
      }
  };

  const formatDateInput = (dateString: string): string => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };


  return (
    <div className="min-h-screen bg-gray-100">
      {/* Anchor for scroll-to-top */}
      <div ref={pageTopRef} />

      <div className="header">
        <div className="left-banner">
          <div className="logo-text">
            <h2>PO Master Dashboard</h2>
          </div>
        </div>
      </div>

      <main className="Main-Dash">
        {loading ? (
            <div className="loading-overlay">
                <div className="loading-content">
                <svg
                    className="loading-spinner"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    />
                    <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                    />
                </svg>
                <p className="text-white text-lg">Please wait, loading data...</p>
                </div>
            </div>
        ) : (
          <>
              {/* Search Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0' }}>
                <div className="flex flex-col">
                  <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64 px-4 py-2 text-sm border-gray-300 rounded-full dashboard-sha focus:outline-none focus:ring-2 focus:ring-red-500"
                      style={{ width: "250px", margin: "10px 10px 10px 0px" }}
                  />
                </div>
                  {/* <div style={{ margin: "10px 0" }}>
                      <label htmlFor="recordsPerPage" className="mr-2 text-sm">
                          Records per page:
                      </label>
                      <select
                          id="recordsPerPage"
                          value={recordsPerPage}
                          onChange={(e) => {
                          setRecordsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                          }}
                          className="border border-gray-300 rounded px-2 py-1"
                      >
                      {[5, 10, 20, 50, 100].map(num => (
                          <option key={num} value={num}>{num}</option>
                      ))}
                      </select>
                  </div>       */}
                  {filteredData.length > 0 && (
                      <button className="btn btn-warning export-btn" type="button" onClick={exportToExcel} style={{ marginLeft: "10px" }}>
                          Export Data
                      </button>
                  )}
                  <i
                      className="fa fa-refresh cursor-pointer text-xl text-gray-700 hover:text-black"
                      onClick={resetFilters}
                      title="Reset Filters"
                      style={{ paddingLeft: "10px" }}
                  ></i>
                  <button className="btn btn-warning export-btn" onClick={openAddPopup} style={{ marginLeft: "10px" }}>
                      <i className="fa fa-mail-forward"></i>Add PO Details
                  </button>
              </div>
              {/* Table */}
              <div className="overflow-x-auto">
                  <div className="table-vert-scroll max-h-[65vh] overflow-y-auto">
                      <table className="min-w-full bg-white rounded-2xl shadow-md">
                          <thead style={{ backgroundColor: "#ce0b0e", position: "sticky", top: "0px" }} className="text-white">
                              <tr>
                                  <th className="px-4 py-2" rowSpan={2}></th>
                                  <th className="px-4 py-2" rowSpan={2}>Vendor Name</th>
                                  <th className="px-4 py-2" rowSpan={2}>Vendor Code</th>
                                  <th className="px-4 py-2" rowSpan={2}>Department</th>
                                  <th className="px-4 py-2" rowSpan={2}>Cost Center</th>
                                  <th className="px-4 py-2" rowSpan={2}>Ref.PR No</th>
                                  <th className="px-4 py-2" rowSpan={2}>Budget Line Item</th>
                                  <th style={{ textAlign: "center" }}  className="px-4 py-2" colSpan={6}>Contract PO Details</th>
                              </tr>
                              <tr>
                                  <th className="px-4 py-2">PO Number</th>
                                  <th className="px-4 py-2">Amount</th>
                                  <th className="px-4 py-2">Current Balance</th>
                                  <th className="px-4 py-2">Date</th>
                                  <th className="px-4 py-2">Start Date</th>
                                  <th className="px-4 py-2">End Date</th>
                              </tr>
                              <tr className="bg-gray-100 text-black">
                                  <th></th>
                                  {["VendorName", "VendorCode", "Department", "CostCenter", "RefPRNo", "BudgetLineItem", "PONumber", "POAmount", "POBalanceAmount", "PODate", "POStartDate", "POEndDate"].map((col) => (
                                      <th key={col} className="px-4 py-1">
                                          <input
                                              type="text"
                                              value={columnFilters[col]}
                                              onChange={(e) => handleColumnFilterChange(col, e.target.value)}
                                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                              placeholder="Search"
                                              style={{ width: "140px" }}
                                          />
                                      </th>
                                  ))}
                                  <th></th>
                                  <th></th>
                              </tr>
                          </thead>
                          <tbody>
                              {[...filteredData].sort((a, b) => b.ID - a.ID).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                  .map((item, index) => (
                                      <tr key={index} className="border-t">
                                          <td className="px-4 py-2"><button className="btn btn-warning export-btn" onClick={() => openEditPopup(item)}><i className="fa fa-edit"></i>Edit</button></td>
                                          <td className="px-4 py-2">{item.VendorName}</td>
                                          <td className="px-4 py-2">{item.VendorCode}</td>
                                          <td className="px-4 py-2">{item.Department}</td>
                                          <td className="px-4 py-2">{item.CostCenter}</td>
                                          <td className="px-4 py-2">{item.RefPRNo}</td>
                                          <td className="px-4 py-2">{item.BudgetLineItem}</td>

                                          {/* Contract PO Details */}
                                          <td className="px-4 py-2">{item.PONumber}</td>
                                          <td className="px-4 py-2">{formatAmount(item.POAmount)}</td>
                                          <td className="px-4 py-2">{formatAmount(item.POBalanceAmount)}</td>
                                          <td className="px-4 py-2">{formatDate(item.PODate)}</td>
                                          <td className="px-4 py-2">{formatDate(item.POStartDate)}</td>
                                          <td className="px-4 py-2">{formatDate(item.POEndDate)}</td>
                                      </tr>
                                  ))}
                          </tbody>
                      </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex justify-center mt-6 overflow-x-auto">
                      <div className="flex space-x-2 flex-nowrap px-4 py-2 bg-orange rounded shadow">
                          <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              style={{ backgroundColor: "orange", color: "black", opacity: currentPage === 1 ? 0.5 : 1 }}
                              className="px-3 py-1 border rounded"
                          >
                              Previous
                          </button>

                          {currentPage > 3 && (
                              <>
                                  <button
                                      onClick={() => handlePageChange(1)}
                                      style={{ backgroundColor: "orange", color: "black" }}
                                      className="px-3 py-1 border rounded"
                                  >
                                      1
                                  </button>
                                  <span className="px-2">...</span>
                              </>
                          )}

                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter((page) => Math.abs(page - currentPage) <= 2)
                              .map((page) => (
                                  <button
                                      key={page}
                                      onClick={() => handlePageChange(page)}
                                      style={{ backgroundColor: currentPage === page ? "yellow" : "orange", color: "black", fontWeight: currentPage === page ? "bold" : "normal" }}
                                      className="px-3 py-1 border rounded"
                                  >
                                      {page}
                                  </button>
                              ))}

                          {currentPage < totalPages - 2 && (
                              <>
                                  <span className="px-2">...</span>
                                  <button
                                      onClick={() => handlePageChange(totalPages)}
                                      style={{ backgroundColor: "orange", color: "black" }}
                                      className="px-3 py-1 border rounded"
                                  >
                                      {totalPages}
                                  </button>
                              </>
                          )}

                          <button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              style={{ backgroundColor: "orange", color: "black", opacity: currentPage === totalPages ? 0.5 : 1 }}
                              className="px-3 py-1 border rounded"
                          >
                              Next
                          </button>
                      </div>
                  </div>
              </div>
              {popupVisible && (
                  <>
                      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-hidden="false">
                          <div className="modal-dialog modal-dialog-baseline modal-fixed">
                              <div className="modal-content">
                                  <div className="modal-body">
                                      <h4 className="modal-title">{isEdit ? "Edit PO Details" : "Add PO Details"}</h4>
                                      <table className="table table-bordered">
                                          <colgroup>
                                              <col style={{ width: '30%' }} />
                                              <col style={{ width: '70%' }} />
                                          </colgroup>
                                          <tbody>
                                              <tr>
                                                  <td>Vendor Name:</td>
                                                  <td>
                                                    <select
                                                      name="VendorName"
                                                      className="form-control"
                                                      value={vendorForm.VendorName}
                                                      onChange={handleVendorChange}
                                                      >
                                                      <option value="">Select Vendor</option>
                                                      {vendors.map((v) => (
                                                          <option key={v.Id} value={v.Title}>
                                                          {v.Title}
                                                          </option>
                                                      ))}
                                                    </select>
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td>Vendor Code:</td>
                                                  <td>
                                                      <input
                                                          name="VendorCode"
                                                          className="form-control"
                                                          value={vendorForm.VendorCode}
                                                          readOnly
                                                      />
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td>Department:</td>
                                                  <td>
                                                      <select
                                                        name="Department"
                                                        className="form-control"
                                                        value={vendorForm.Department}
                                                        onChange={handleDepartmentChange}
                                                      >
                                                        <option value="">Select Department</option>
                                                        {departments.map((d, index) => (
                                                          <option key={index} value={d}>
                                                            {d}
                                                          </option>
                                                        ))}
                                                      </select>
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td>Cost Center:</td>
                                                  <td>
                                                      <select
                                                        name="CostCenter"
                                                        className="form-control"
                                                        value={vendorForm.CostCenter}
                                                        onChange={handleInputChange}
                                                      >
                                                        <option value="">Select Cost Center</option>
                                                        {filteredCostCenters.map((c) => (
                                                          <option key={c.Id} value={c.Title}>
                                                            {c.Title.split("-")[0]}
                                                          </option>
                                                        ))}
                                                      </select>
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td>Ref.PR No:</td>
                                                  <td>
                                                      <input
                                                          name="RefPRNo"
                                                          className="form-control"
                                                          value={vendorForm.RefPRNo}
                                                          onChange={handleInputChange}
                                                      />
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td>Budget Line Item:</td>
                                                  <td>
                                                      <input
                                                          name="BudgetLineItem"
                                                          className="form-control"
                                                          value={vendorForm.BudgetLineItem}
                                                          onChange={handleInputChange}
                                                      />
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td>PO Number:</td>
                                                  <td>
                                                      <input
                                                          name="PONumber"
                                                          className="form-control"
                                                          value={vendorForm.PONumber}
                                                          onChange={handleInputChange}
                                                      />
                                                      <button className="btn btn-warning export-btn"
                                                          onClick={handleGetPRData}
                                                          style={{ marginLeft: "10px", marginTop: "10px" }}
                                                      >
                                                          Get PR No and Budget Item
                                                      </button>
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td>PO Amount</td>
                                                  <td>
                                                      <input
                                                          name="POAmount"
                                                          className="form-control"
                                                          value={vendorForm.POAmount}
                                                          onChange={handleInputChange}
                                                      />
                                                  </td>
                                              </tr>
                                              {/* <tr>
                                                  <td>Current Balance:</td>
                                                  <td>
                                                      <input
                                                          name="POBalanceAmount"
                                                          className="form-control"
                                                          value={vendorForm.POBalanceAmount}
                                                          onChange={handleInputChange}
                                                      />
                                                  </td>
                                              </tr> */}
                                              <tr>
                                                  <td>Date:</td>
                                                  <td>
                                                      <input
                                                          name="PODate"
                                                          type="date"
                                                          className="form-control"
                                                          value={vendorForm.PODate}
                                                          onChange={handleInputChange}
                                                      />
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td>Start Date:</td>
                                                  <td>
                                                      <input
                                                          name="POStartDate"
                                                          type="date"
                                                          className="form-control"
                                                          value={vendorForm.POStartDate}
                                                          onChange={handleInputChange}
                                                      />
                                                  </td>
                                              </tr>
                                              <tr>
                                                  <td>End Date:</td>
                                                  <td>
                                                      <input
                                                          name="POEndDate"
                                                          type="date"
                                                          className="form-control"
                                                          value={vendorForm.POEndDate}
                                                          onChange={handleInputChange}
                                                      />
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </div>
                                  <div className="modal-footer">
                                      <button type="button" className="btn btn-primary" onClick={update}>{isEdit ? "Update" : "Submit"}</button>
                                      <button type="button" className="btn btn-secondary" onClick={() => setPopupVisible(false)}>Cancel</button>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="modal-backdrop fade show" />
                  </>
              )}
          </>
        )}
      </main>
    </div>
  );

};

export default POMaster;
