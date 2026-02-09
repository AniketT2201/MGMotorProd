import * as React from "react";
import { useState, useEffect, useRef } from "react";
import type { IMgMotorProdProps } from "../IMgMotorProdProps";
import IASRequestsOps from "../../service/BAL/SPCRUD/RO";
import SPCRUDOPS from "../../service/DAL/spcrudops";
import { useHistory } from 'react-router-dom';
import "../Pages/CSS/NewRequest.scss";
import * as XLSX from 'xlsx';

export const ArchiveReport: React.FC<IMgMotorProdProps> = (props: IMgMotorProdProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [IASData, setIASData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showFilterPopup, setShowFilterPopup] = useState(false);
    const [MovementDropdown, setMovementDropdown] = useState<any[]>([]);
    const [Yeardropdown, setYeardropdown] = useState<any[]>([]);
    const [ListPopup, setListPopup] = useState(false);

    const [filterInputs, setFilterInputs] = useState({
        ageing: "",
        movementType: "",
        approvalNoteYear: "",
    });
    const [filterInputs2, setFilterInputs2] = useState({ Year: "" });

    // ✅ Updated filters state to include AuthorTitle, NATitle, DATitle
    const [columnFilters, setColumnFilters] = useState({
        Title: "",
        ApprovalNoteNo: "",
        AuthorTitle: "",
        Department: "",
        Created: "",
        MovementType: "",
        MovementReason: "",
        CostCenter: "",
        GrossValue: "",
        NetValue: "",
        Status: "",
        NATitle: "",
        DATitle: "",
        AgeingCurrent: "",
        AgeingCreate: ""
    });

    const resetFilters = () => {
        setColumnFilters({
            Title: "",
            ApprovalNoteNo: "",
            AuthorTitle: "",
            Department: "",
            Created: "",
            MovementType: "",
            MovementReason: "",
            CostCenter: "",
            GrossValue: "",
            NetValue: "",
            Status: "",
            NATitle: "",
            DATitle: "",
            AgeingCurrent: "",
            AgeingCreate: ""
        });
        setSearchTerm("");
        setFilterInputs({ ageing: "", movementType: "", approvalNoteYear: "" });
    };

    const pageTopRef = useRef<HTMLDivElement | null>(null);
    const itemsPerPage = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    let listname = useRef('');
    const history = useHistory();

    const handleTitleClick = (id) => {
        sessionStorage.setItem('dashboardState', JSON.stringify({
            searchTerm,
            columnFilters,
            currentPage,
            filterInputs,
        }));
        sessionStorage.setItem('sidebarFrom', '/ArchiveReport');        
        
        history.push({ pathname: '/ApprovalForm', search: `?ItemId=${id}&from=ArchiveReport&user=${listname.current}` });
        
    };

    async function GetMovementflow() {
        const spCrudOps = await SPCRUDOPS();
        const Momentflowdata = await spCrudOps.getData(
            'MovementFlow',
            '*,ApprovalNoteDescription,Title,ID',
            '',
            '',
            { column: 'ID', isAscending: true },
            props
        );
        setMovementDropdown(Momentflowdata);
    }

    async function GetYearflow() {
        const spCrudOps = await SPCRUDOPS();
        const Yeardata = await spCrudOps.getData(
            'ArchiveList',
            'Year,ListName',
            '',
            '',
            { column: 'ID', isAscending: true },
            props
        );
        setYeardropdown(Yeardata);
    }

    const dateDifference = (fromDt: Date, toDt: Date) => {
        const diff = new Date(toDt.getTime() - fromDt.getTime());
        const days = diff.getTime() / 1000 / 60 / 60 / 24;
        return days.toFixed(0);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB'); // dd/mm/yyyy
    };

    const GetIASData = async (ListName) => {
        listname.current = ListName;
        await EmployeeProfile(props.userEmail);
        setLoading(true);

        const spCrudOps = await SPCRUDOPS();
        const IASColl = await spCrudOps.getData(
            ListName,
            "*,ApprovalNoteNo,SAPNo,MovementReason,Status,Stage,NA/ID,NA/Title,NA/EMail,DA/ID,DA/Title,DA/EMail,Details,Summary,WF,HeaderName,MovementType,Department,CostCenter,UniquePartImpact,GrossValue,NetValue,LastAction,CostCenterDescription,Author/Title,NextApproverEmpID",
            "NA,DA,Author",
            "",
            { column: 'ID', isAscending: true },
            props
        );

        setIASData(IASColl);
        setFilteredData(IASColl);
        setLoading(false);
    };

    const applyAdvancedFiltersPageload = (inputs = filterInputs) => {
        let filtered = IASData;
        if (inputs.ageing) {
            filtered = filtered.filter(item => {
                const daysStr = item.Status === "Pending for Approval"
                    ? dateDifference(new Date(item.Created), new Date())
                    : "0";
                return parseInt(daysStr, 10) === parseInt(inputs.ageing, 10);
            });
        }
        if (inputs.movementType) {
            filtered = filtered.filter((item) => item.MovementType === inputs.movementType);
        }
        if (inputs.approvalNoteYear) {
            filtered = filtered.filter((item) =>
                item.ApprovalNoteYear?.toString().includes(inputs.approvalNoteYear)
            );
        }
        setFilteredData(filtered);
    };

    useEffect(() => {
        GetYearflow();
        GetMovementflow();
    }, []);

    useEffect(() => {
        if (IASData.length > 0) {
            const savedState = sessionStorage.getItem('dashboardState');
            if (savedState) {
                const saved = JSON.parse(savedState);
                setSearchTerm(saved.searchTerm || '');
                setColumnFilters(saved.columnFilters || {});
                setCurrentPage(saved.currentPage || 1);
                setFilterInputs(saved.filterInputs || {});
                applyAdvancedFiltersPageload(saved.filterInputs || {});
                sessionStorage.removeItem('dashboardState');
            }
        }
    }, [IASData]);

    // ✅ Fixed column search
    useEffect(() => {
        let filtered = IASData;
        Object.keys(columnFilters).forEach((key) => {
            const value = columnFilters[key]?.toLowerCase();
            if (!value) return;

            filtered = filtered.filter((item) => {
                let fieldValue = "";
                switch (key) {
                    case "AuthorTitle":
                        fieldValue = item?.Author?.Title || "";
                        break;
                    case "NATitle":
                        fieldValue = item?.NA?.Title || "";
                        break;
                    case "DATitle":
                        fieldValue = item?.DA?.Title || "";
                        break;
                    case "Created":
                        fieldValue = formatDate(item?.Created) || "";
                        break;
                    case "AgeingCurrent":
                        fieldValue = item?.Status === "Pending for Approval"
                            ? dateDifference(new Date(item?.LastAction), new Date())
                            : "0";
                        break;
                    case "AgeingCreate":
                        fieldValue =
                            item?.Status === "Pending for Approval"
                                ? dateDifference(new Date(item?.Created), new Date())
                                : item?.Status === "Draft"
                                    ? "0"
                                    : dateDifference(new Date(item?.Created), new Date(item?.LastAction));
                        break;
                    default:
                        fieldValue = item?.[key] || "";
                }
                return fieldValue.toString().toLowerCase().includes(value);
            });
        });
        setFilteredData(filtered);
        setCurrentPage(1);
    }, [columnFilters, IASData]);

    // 🔎 global search remains same
    useEffect(() => {
        if (!searchTerm) {
            setFilteredData(IASData);
        } else {
            const lowerSearch = searchTerm.toLowerCase();
            const filtered = IASData.filter(item =>
                item.Title?.toLowerCase().includes(lowerSearch) ||
                item.ApprovalNoteNo?.toLowerCase().includes(lowerSearch) ||
                item.Author?.Title?.toLowerCase().includes(lowerSearch) ||
                item.Department?.toLowerCase().includes(lowerSearch) ||
                item.Status?.toLowerCase().includes(lowerSearch) ||
                formatDate(item.Created)?.toLowerCase().includes(lowerSearch) ||
                item.MovementType?.toLowerCase().includes(lowerSearch) ||
                item.MovementReason?.toLowerCase().includes(lowerSearch) ||
                item.CostCenter?.toLowerCase().includes(lowerSearch) ||
                item.GrossValue?.toLowerCase().includes(lowerSearch) ||
                item.NetValue?.toLowerCase().includes(lowerSearch) ||
                item.NA?.Title?.toLowerCase().includes(lowerSearch) ||
                item.DA?.Title?.toLowerCase().includes(lowerSearch)
            );
            setFilteredData(filtered);
            setCurrentPage(1);
        }
    }, [searchTerm, IASData]);

    const handleColumnFilterChange = (key: string, value: string) => {
        setColumnFilters(prev => ({ ...prev, [key]: value }));
    };

    /********** Advanced Filters **********/
    const applyAdvancedFilters = () => {
        const { ageing, movementType, approvalNoteYear } = filterInputs;
        let filtered = [...IASData];

        if (ageing) {
            filtered = filtered.filter(item => {
                const daysStr = item.Status === "Pending for Approval"
                    ? dateDifference(new Date(item.Created), new Date())
                    : "0";
                return parseInt(daysStr, 10) === parseInt(ageing, 10);
            });
        }

        if (movementType) {
            filtered = filtered.filter(item =>
                item.MovementType?.toLowerCase() === movementType.toLowerCase()
            );
        }

        if (approvalNoteYear) {
            const searchTerm = approvalNoteYear.toLowerCase();
            filtered = filtered.filter(item =>
                item.ApprovalNoteNo?.toLowerCase().includes(searchTerm)
            );
        }

        setFilteredData(filtered);
        setCurrentPage(1);
    };

    // User Master Data
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
            pageTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const exportToExcel = () => {
        const dataToExport = filteredData;
        if (dataToExport.length === 0) {
            alert("No records found to export.");
            return;
        }

        const exportData = dataToExport.map((item) => ({
            "Request number": item.Title,
            "Approval Note Number": item.ApprovalNoteNo,
            "Initiator": item?.Author?.Title,
            "Department": item.Department,
            "Request Create": formatDate(item.Created),
            "Movement type": item.MovementType,
            "Reason": item.MovementReason,
            "Cost Center": item.CostCenter,
            "Gross Value": item.GrossValue,
            "Net Value": item.NetValue,
            "Status": item.Status,
            "Next Approver": item?.NA?.Title,
            "Delegate Approver": item?.DA?.Title,
            "Ageing with current approver":
                item.Status === "Pending for Approval"
                    ? dateDifference(new Date(item.LastAction), new Date())
                    : 0,
            "Ageing from Create Date":
                item.Status === "Pending for Approval"
                    ? dateDifference(new Date(item.Created), new Date())
                    : item.Status === "Draft"
                        ? 0
                        : dateDifference(new Date(item.Created), new Date(item.LastAction)),
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "AllRequests");

        const today = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `IAS_${today}.xlsx`);
    };

    /********** Render **********/
    return (
        <div className="min-h-screen bg-gray-100">
            <div ref={pageTopRef} />

            <div className="header">
                <div className="left-banner">
                    <div className="logo-text">
                        <h2>Archive Report</h2>
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
                        {/* Top Controls */}
                        <div className="flex items-center gap-4">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64 px-4 py-2 text-sm border-gray-300 rounded-full dashboard-sha focus:outline-none focus:ring-2 focus:ring-red-500"
                                style={{ width: "250px", margin: "10px 10px 10px 0px" }}
                            />
                            <button className="btn btn-warning export-btn" type="button" onClick={() => setShowFilterPopup(true)} style={{ paddingRight: "10px" }}>Filter</button>
                            <button className="btn btn-warning export-btn" type="button" onClick={() => setListPopup(true)} style={{ marginLeft: "10px" }}>Get Data</button>

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
                                            <th className="px-4 py-2">Approval Note Number</th>
                                            <th className="px-4 py-2">Initiator</th>
                                            <th className="px-4 py-2">Department</th>
                                            <th className="px-4 py-2">Request Create</th>
                                            <th className="px-4 py-2">Movement type</th>
                                            <th className="px-4 py-2">Reason</th>
                                            <th className="px-4 py-2">Cost Center</th>
                                            <th className="px-4 py-2">Gross Value</th>
                                            <th className="px-4 py-2">Net Value</th>
                                            <th className="px-4 py-2">Status</th>
                                            <th className="px-4 py-2">Next Approver</th>
                                            <th className="px-4 py-2">Delegate Approver</th>
                                            <th className="px-4 py-2">Ageing with current approver</th>
                                            <th className="px-4 py-2">Ageing from Create Date</th>
                                        </tr>
                                        <tr className="bg-gray-100 text-black">
                                            {[
                                                "Title",
                                                "ApprovalNoteNo",
                                                "AuthorTitle",
                                                "Department",
                                                "Created",
                                                "MovementType",
                                                "MovementReason",
                                                "CostCenter",
                                                "GrossValue",
                                                "NetValue",
                                                "Status",
                                                "NATitle",
                                                "DATitle",
                                                "AgeingCurrent",
                                                "AgeingCreate"
                                            ].map((col) => (
                                                <th key={col} className="px-4 py-1">
                                                    <input
                                                        type="text"
                                                        value={columnFilters[col] || ""}
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
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleTitleClick(item.ID);
                                                            }}
                                                            href={`${window.location.href.split('#')[0]}#/ApprovalForm?ItemId=${item.ID}&from=ArchiveReport&user=${listname.current}`}                                                            
                                                            className="text-blue-600 hover:text-blue-800 underline"
                                                        >
                                                            {item.Title}
                                                        </a>
                                                    </td>
                                                    <td className="px-4 py-2">{item.ApprovalNoteNo}</td>
                                                    <td className="px-4 py-2">{item?.Author?.Title}</td>
                                                    <td className="px-4 py-2">{item?.Department}</td>
                                                    <td className="px-4 py-2">{formatDate(item?.Created)}</td>
                                                    <td className="px-4 py-2">{item?.MovementType}</td>
                                                    <td className="px-4 py-2">{item?.MovementReason}</td>
                                                    <td className="px-4 py-2">{item?.CostCenter}</td>
                                                    <td className="px-4 py-2" style={{ textAlign: 'end' }}>{item?.GrossValue}</td>
                                                    <td className="px-4 py-2" style={{ textAlign: 'end' }}>{item?.NetValue}</td>
                                                    <td className="px-4 py-2">{item?.Status}</td>
                                                    <td className="px-4 py-2">{item?.NA?.Title}</td>
                                                    <td className="px-4 py-2">{item?.DA?.Title}</td>
                                                    <td className="px-4 py-2">
                                                        {item?.Status === "Pending for Approval"
                                                            ? dateDifference(new Date(item?.LastAction), new Date())
                                                            : 0}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {item?.Status === "Pending for Approval"
                                                            ? dateDifference(new Date(item?.Created), new Date())
                                                            : item?.Status === "Draft"
                                                                ? 0
                                                                : dateDifference(new Date(item?.Created), new Date(item?.LastAction))}
                                                    </td>
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

                                    {showFilterPopup && (
                                        <>
                                            <div
                                                className="modal fade show d-block"
                                                tabIndex={-1}
                                                role="dialog"
                                                aria-hidden="false"
                                            >
                                                <div className="modal-dialog modal-lg">
                                                    <div className="modal-content">
                                                        <div className="modal-body">
                                                            {/* Header */}
                                                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                                                <span className="h4">Advanced Filters</span>
                                                            </div>

                                                            {/* Filter Form */}
                                                            <form className="mt-3">
                                                                {/* Ageing */}
                                                                <div className="form-group mb-3">
                                                                    <label>Ageing (from Create Date)</label>
                                                                    <input
                                                                        type="number"
                                                                        className="form-control"
                                                                        value={filterInputs.ageing || ""}
                                                                        onChange={(e) =>
                                                                            setFilterInputs({ ...filterInputs, ageing: e.target.value })
                                                                        }
                                                                        placeholder="Enter number of days"
                                                                    />
                                                                </div>

                                                                {/* Movement Type */}
                                                                <div className="form-group mb-3">
                                                                    <label>Movement Type</label>
                                                                    <select
                                                                        className="select.form-control.mt-2"
                                                                        value={filterInputs.movementType || ""}
                                                                        onChange={(e) =>
                                                                            setFilterInputs({
                                                                                ...filterInputs,
                                                                                movementType: e.target.value,
                                                                            })
                                                                        }
                                                                    >
                                                                        <option value="">Select</option>
                                                                        {MovementDropdown?.map((Vend) => (
                                                                            <option key={Vend.ID} value={Vend.Title}>
                                                                                {Vend.ApprovalNoteDescription}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>

                                                                {/* Approval Note Year */}
                                                                <div className="form-group mb-3">
                                                                    <label>Approval Note Year</label>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control"
                                                                        value={filterInputs.approvalNoteYear || ""}
                                                                        onChange={(e) =>
                                                                            setFilterInputs({
                                                                                ...filterInputs,
                                                                                approvalNoteYear: e.target.value,
                                                                            })
                                                                        }
                                                                        placeholder="Enter year or keyword"
                                                                    />
                                                                </div>
                                                            </form>
                                                        </div>

                                                        {/* Footer Buttons */}
                                                        <div className="modal-footer">
                                                            <button
                                                                type="button"
                                                                className="btn btn-primary"
                                                                onClick={() => {
                                                                    applyAdvancedFilters();
                                                                    setShowFilterPopup(false);
                                                                }}
                                                            >
                                                                Apply Filters
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary"
                                                                onClick={() => setShowFilterPopup(false)}
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setFilterInputs({ ageing: "", movementType: "", approvalNoteYear: "" });
                                                                    setFilteredData(IASData);
                                                                }}
                                                                className="ml-2 px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                                                            >
                                                                Clear Filters
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="modal-backdrop fade show" />
                                        </>
                                    )}

                                    {ListPopup && (
                                        <>
                                            <div
                                                className="modal fade show d-block"
                                                tabIndex={-1}
                                                role="dialog"
                                                aria-hidden="false"
                                            >
                                                <div className="modal-dialog modal-lg">
                                                    <div className="modal-content">
                                                        <div className="modal-body">
                                                            {/* Header */}
                                                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                                                <span className="h4">Select Year for Generating Report</span>
                                                            </div>

                                                            {/* Filter Form */}
                                                            <form className="mt-3">

                                                                {/* Movement Type */}
                                                                <div className="form-group mb-3">
                                                                    <label>Select Year</label>
                                                                    <select
                                                                        className="select.form-control.mt-2"
                                                                        value={filterInputs2.Year || ""}
                                                                        onChange={(e) =>
                                                                            setFilterInputs2({
                                                                                ...filterInputs2,
                                                                                Year: e.target.value,
                                                                            })
                                                                        }
                                                                    >
                                                                        <option value="">Select</option>
                                                                        {Yeardropdown?.map((Vend) => (
                                                                            <option key={Vend.ListName} value={Vend.ListName}>
                                                                                {Vend.Year}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>

                                                            </form>
                                                        </div>

                                                        {/* Footer Buttons */}
                                                        <div className="modal-footer">
                                                            <button
                                                                type="button"
                                                                className="btn btn-primary"
                                                                onClick={() => {
                                                                    GetIASData(filterInputs2.Year);
                                                                    setListPopup(false);
                                                                }}
                                                            >
                                                                Get Data
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary"
                                                                onClick={() => setListPopup(false)}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="modal-backdrop fade show" />
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

export default ArchiveReport;

