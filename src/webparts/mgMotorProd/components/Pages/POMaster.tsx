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

export const POMaster: React.FC<IMgMotorProdProps> = (props: IMgMotorProdProps) => {

    const [searchTerm, setSearchTerm] = useState("");
    const [ROData, setROData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [popupVisible, setPopupVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showFilterPopup, setShowFilterPopup] = useState(false);
    const [MovementDropdown, setMovementDropdown] = useState<any[]>([]);
    const [recordsPerPage, setRecordsPerPage] = useState(10); // default 10 records per page
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
        Amount: "",
        CurrentBalance: "",
        Date: "",
        StartDate: "",
        EndDate: ""
    });

    const [columnFilters, setColumnFilters] = useState({
        VendorName: "",
        VendorCode: "",
        Department: "",
        CostCenter: "",
        RefPRNo: "",
        BudgetLineItem: "",
        PONumber: "",
        Amount: "",
        CurrentBalance: "",
        Date: "",
        StartDate: "",
        EndDate: ""
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
            Amount: "",
            CurrentBalance: "",
            Date: "",
            StartDate: "",
            EndDate: ""
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
    
        console.log('PO data: ', ROColl);// Debug log
        setROData(ROColl);
        setFilteredData(ROColl);
        setLoading(false);
    };

    useEffect(() => {
        GetROData();

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
                item.VendorName.toLowerCase().includes(lowerSearch) ||
                item.VendorCode.toLowerCase().includes(lowerSearch) ||
                item.Department.toLowerCase().includes(lowerSearch) ||
                item.CostCenter.toLowerCase().includes(lowerSearch) ||
                item.RefPRNo.toLowerCase().includes(lowerSearch) ||
                item.BudgetLineItem.toLowerCase().includes(lowerSearch) ||
                item.PONumber.toLowerCase().includes(lowerSearch) ||
                item.Amount.toString().toLowerCase().includes(lowerSearch) ||
                item.CurrentBalance.toString().toLowerCase().includes(lowerSearch) ||
                item.Date.toLowerCase().includes(lowerSearch) ||
                item.StartDate.toLowerCase().includes(lowerSearch) ||
                item.EndDate.toLowerCase().includes(lowerSearch) 
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
            "Amount": item.Amount,
            "Current Balance": item.CurrentBalance,
            "Date": item.Date,
            "Start Date": item.StartDate,
            "End Date": item.EndDate
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
        Amount: "",
        CurrentBalance: "",
        Date: "",
        StartDate: "",
        EndDate: ""
    });
    setPopupVisible(true);
    };

    const openEditPopup = (item) => {
    setIsEdit(true);
    setSelectedId(item.ID);
    setVendorForm({
        VendorName: item.VendorName,
        VendorCode: item.VendorCode,
        Department: item.Department,
        CostCenter: item.CostCenter,
        RefPRNo: item.RefPRNo,
        BudgetLineItem: item.BudgetLineItem,
        PONumber: item.PONumber,
        Amount: item.Amount,
        CurrentBalance: item.CurrentBalance,
        Date: item.Date,
        StartDate: item.StartDate,
        EndDate: item.EndDate
    });
    setPopupVisible(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setVendorForm(prev => ({ ...prev, [name]: value }));
    };

    const update = async () => {
        const spCrudObj = await SPCRUDOPS();
        if (!vendorForm.VendorName || !vendorForm.VendorCode) {
            alert("Vendor Name & Vendor Code are required");
            return;
        }
        try {
            if (isEdit && selectedId) {
            await spCrudObj.updateData('PO_Master_List', selectedId, vendorForm, props);
            } else {
            await spCrudObj.insertData('PO_Master_List', vendorForm, props);
            }

            setPopupVisible(false);
            GetROData(); // refresh grid
        } catch (err) {
            console.error(err);
            alert("Error saving vendor");
        }
    };




    return (
        <div className="min-h-screen bg-gray-100">
            {/* Anchor for scroll-to-top */}
            <div ref={pageTopRef} />

            <div className="header">
                <div className="left-banner">
                    <div className="logo-text">
                        <h2>Vendor Master Dashboard</h2>
                    </div>
                </div>
            </div>

            <main className="Main-Dash">
                {loading ? (
                    <div className="loading-overlay">
                        <div className="loading-content">
                            <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
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
                                <i className="fa fa-mail-forward"></i>Add Vendor
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
                                            <th className="px-4 py-2" colSpan={6} style={{ textAlign: "center" }}>Contract PO Details</th>
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
                                            {["Title", "VendorCode", "Department", "CostCenter", "RefPRNo", "BudgetLineItem", "PONumber", "Amount", "CurrentBalance", "Date", "StartDate", "EndDate"].map((col) => (
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
                                                    <td className="px-4 py-2">{item.Amount}</td>
                                                    <td className="px-4 py-2">{item.CurrentBalance}</td>
                                                    <td className="px-4 py-2">{item.Date}</td>
                                                    <td className="px-4 py-2">{item.StartDate}</td>
                                                    <td className="px-4 py-2">{item.EndDate}</td>
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
                                    <div className="modal-dialog modal-lg">
                                        <div className="modal-content">
                                            <div className="modal-body">
                                                <h4 className="modal-title">{isEdit ? "Edit Vendor" : "Add Vendor"}</h4>
                                                <table className="table table-bordered">
                                                    <colgroup>
                                                        <col style={{ width: '30%' }} />
                                                        <col style={{ width: '70%' }} />
                                                    </colgroup>
                                                    <tbody>
                                                        <tr>
                                                            <td>Vendor Name:</td>
                                                            <td>
                                                            <input
                                                                name="Title"
                                                                className="form-control"
                                                                value={vendorForm.VendorName}
                                                                onChange={handleInputChange}
                                                            />
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>Vendor Code:</td>
                                                            <td>
                                                                <input
                                                                    name="VendorCode"
                                                                    className="form-control"
                                                                    value={vendorForm.VendorCode}
                                                                    onChange={handleInputChange}
                                                                />
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>Department:</td>
                                                            <td>
                                                                <input
                                                                    name="Department"
                                                                    className="form-control"
                                                                    value={vendorForm.Department}
                                                                    onChange={handleInputChange}
                                                                />
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>Cost Center:</td>
                                                            <td>
                                                                <input
                                                                    name="CostCenter"
                                                                    className="form-control"
                                                                    value={vendorForm.CostCenter}
                                                                    onChange={handleInputChange}
                                                                />
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
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>Amount:</td>
                                                            <td>
                                                                <input
                                                                    name="Amount"
                                                                    className="form-control"
                                                                    value={vendorForm.Amount}
                                                                    onChange={handleInputChange}
                                                                />
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>Current Balance:</td>
                                                            <td>
                                                                <input
                                                                    name="CurrentBalance"
                                                                    className="form-control"
                                                                    value={vendorForm.CurrentBalance}
                                                                    onChange={handleInputChange}
                                                                />
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>Date:</td>
                                                            <td>
                                                                <input
                                                                    name="Date"
                                                                    type="date"
                                                                    className="form-control"
                                                                    value={vendorForm.Date}
                                                                    onChange={handleInputChange}
                                                                />
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>Start Date:</td>
                                                            <td>
                                                                <input
                                                                    name="StartDate"
                                                                    type="date"
                                                                    className="form-control"
                                                                    value={vendorForm.StartDate}
                                                                    onChange={handleInputChange}
                                                                />
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>End Date:</td>
                                                            <td>
                                                                <input
                                                                    name="EndDate"
                                                                    type="date"
                                                                    className="form-control"
                                                                    value={vendorForm.EndDate}
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
