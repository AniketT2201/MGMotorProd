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

export const AllReqDash: React.FC<IMgMotorProdProps> = (props: IMgMotorProdProps) => {

    const [searchTerm, setSearchTerm] = useState("");
    const [ROData, setROData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilterPopup, setShowFilterPopup] = useState(false);
    const [MovementDropdown, setMovementDropdown] = useState<any[]>([]);
    const [recordsPerPage, setRecordsPerPage] = useState(10); // default 10 records per page
    const [ROACL, setROACL] = React.useState<any[]>([]);
    const [AppAdmin, setAppAdmin] = React.useState(false);
    const [Admin, setAdmin] = React.useState(false);
    const [Editor, setEditor] = React.useState(false);
    const [filterInputs, setFilterInputs] = useState({
        ageing: "",
        movementType: "",
        approvalNoteYear: "",
    });

    const [columnFilters, setColumnFilters] = useState({
        ReqNo: "",
        InitiatorName: "",
        PONumber: "",
        ROAmount: "",
        Purpose: "",
        Status: "",
        NextApprover: ""
    });

    const resetFilters = () => {
        setColumnFilters({
            ReqNo: "",
            InitiatorName: "",
            PONumber: "",
            ROAmount: "",
            Purpose: "",
            Status: "",
            NextApprover: ""
        });
        setSearchTerm("");
        //setFilterInputs({ ageing: "", movementType: "", approvalNoteYear: "" });
    };
    // Smooth‑scroll anchor
    const pageTopRef = useRef<HTMLDivElement | null>(null);
    const itemsPerPage = 10;
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

    async function GetROACL() {
    const spCrudOps = await SPCRUDOPS();

    const aclData = await spCrudOps.getData(
        'ROACL',
        'ID,Title,UserName/Title,UserName/EMail,Role,EmployeeID',
        'UserName',
        '',
        { column: 'ID', isAscending: true },
        props
    );

    const currentUserACL = aclData.filter(
        (item) =>
        item.UserName?.EMail === props.userEmail &&
        item.EmployeeID === props.EmployeeId[0].EmployeeID
    );

    const isSysAdmin = currentUserACL.some(x => x.Title === "SysAdmin");
    const isAppAdmin = currentUserACL.some(x => x.Title === "AppAdmin");

    setAdmin(isSysAdmin);
    setAppAdmin(isAppAdmin);
    setEditor(currentUserACL.some(x => x.Role === "Editor"));

    setROACL(currentUserACL);

    return {
        isSysAdmin,
        isAppAdmin
    };
    }

    const GetROData = async () => {
        await EmployeeProfile(props.userEmail);
        setLoading(true);
        // 🔹 1. Get ACL
        const { isSysAdmin, isAppAdmin } = await GetROACL();

        // 🔹 2. Get user department
        const userProfile = await EmployeeProfile(props.userEmail);
        const userDepartment = userProfile[0]?.DepartmentCode?.Department;
        const ROColl = await RORequestsOps().getIROData(
            { column: "ID", isAscending: false },
            props,
            ''
        );
        let ROCollFilter = ROColl.filter((test) => test.Status != "Draft" && test.Status != "Withdrawn" && test.Status != "Reject");
        // 🔥 🔥 🔥 MAIN LOGIC
        if (!isSysAdmin && !isAppAdmin) {
            ROCollFilter = ROCollFilter.filter(
            (item) => item.Department === userDepartment
            );
        }
        const normalizedRO = ROCollFilter.map((ro) => {
            let poNumber = "-";

            try {
                const poArr = JSON.parse(ro.PODetails);
                poNumber = poArr?.[0]?.PONumber ?? "-";
            } catch (err) {
                console.warn("Invalid PODetails JSON for RO ID:", ro.ID);
            }

            return {
                ...ro,
                PONumber: poNumber,
            };
        });

        console.log('RO data: ', ROCollFilter);// Debug log
        setROData(normalizedRO);
        setFilteredData(normalizedRO);
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
                item.ReqNo?.toLowerCase().includes(lowerSearch) ||
                item.InitiatorName?.toLowerCase().includes(lowerSearch) ||
                item.NextApprover?.toLowerCase().includes(lowerSearch) ||
                item.PONumber?.toLowerCase().includes(lowerSearch) ||
                item.Purpose?.toLowerCase().includes(lowerSearch) ||
                item.ROAmount?.toString().includes(lowerSearch) ||
                item.Status?.toLowerCase().includes(lowerSearch) 
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
            "Request number": item.Title,
            "Initiator Name": item.InitiatorName,
            "Status": item.Status,
            "Next Approver": item.NextApprover,
            "PO Number": item.PONumber,
            "RO Amount": item.ROAmount,
            "Purpose": item.Purpose,
        }));

        // Create sheet + workbook
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "AllRequests");

        // Save file with today’s date
        const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
        XLSX.writeFile(workbook, `RO_${today}.xlsx`);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Anchor for scroll-to-top */}
            <div ref={pageTopRef} />

            <div className="header">
                <div className="left-banner">
                    <div className="logo-text">
                        <h2>All Request Dashboard</h2>
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
                        <div className="flex items-center gap-4">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64 px-4 py-2 text-sm border-gray-300 rounded-full dashboard-sha focus:outline-none focus:ring-2 focus:ring-red-500"
                                style={{ width: "250px", margin: "10px 10px 10px 0px" }}
                            />
                            {/* <div style={{ margin: "10px 0" }}>
                                <label htmlFor="recordsPerPage" className="mr-2 text-sm">Records per page:</label>
                                <select
                                id="recordsPerPage"
                                value={recordsPerPage}
                                onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="border border-gray-300 rounded px-2 py-1"
                                >
                                {[5, 10, 20, 50, 100].map(num => (
                                    <option key={num} value={num}>{num}</option>
                                ))}
                                </select>
                            </div> */}
                            
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
                        </div>
                        {/* Table */}
                        <div className="overflow-x-auto">
                            <div className="table-vert-scroll max-h-[65vh] overflow-y-auto">
                                <table className="min-w-full bg-white rounded-2xl shadow-md">
                                    <thead style={{ backgroundColor: "#ce0b0e", position: "sticky", top: "0px" }} className="text-white">
                                        <tr>
                                            <th className="px-4 py-2">Request number</th>
                                            <th className="px-4 py-2">Initiator Name</th>
                                            <th className="px-4 py-2">Status</th>
                                            <th className="px-4 py-2">Next Approver</th>
                                            <th className="px-4 py-2">PO Number</th>
                                            <th className="px-4 py-2">RO Amount</th>
                                            <th className="px-4 py-2">Purpose</th>
                                        </tr>
                                        <tr className="bg-gray-100 text-black">
                                            {["ReqNo", "InitiatorName", "Status", "NextApprover", "PONumber", "ROAmount", "Purpose"].map((col) => (
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
                                                    <td className="px-4 py-2">                                                        
                                                        <a
                                                            onClick={(e) => { e.preventDefault(); handleTitleClick(item.ID); }}
                                                            href={
                                                                (item.Status === 'Draft' || item.Status === 'Rework')
                                                                    ? `${window.location.href.split('#')[0]}#/Draft?ItemId=${item.ID}&from=AllReqDash`
                                                                    : `${window.location.href.split('#')[0]}#/ApprovalForm?ItemId=${item.ID}&from=AllReqDash`
                                                            }
                                                            className="text-blue-600 hover:text-blue-800 underline">{item.ReqNo}
                                                        </a>
                                                    </td>
                                                    <td className="px-4 py-2">{item.InitiatorName}</td>
                                                    <td className="px-4 py-2">{item.Status}</td>
                                                    <td className="px-4 py-2">{item.NextApprover}</td>
                                                    <td className="px-4 py-2">{item.PONumber}</td>
                                                    <td className="px-4 py-2">{formatAmount(item.ROAmount)}</td>
                                                    <td className="px-4 py-2">{item.Purpose}</td>
                                                    
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
                    </>
                )}
            </main>
        </div>
    );

};

export default AllReqDash;
