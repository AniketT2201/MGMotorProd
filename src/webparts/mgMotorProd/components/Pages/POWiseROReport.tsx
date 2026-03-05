import * as React from "react";
import { useState, useEffect, useRef } from "react";
import type { IMgMotorProdProps } from "../IMgMotorProdProps";
import SPCRUDOPS from "../../service/DAL/spcrudops";
import { useHistory } from 'react-router-dom';
import "./CSS/NewRequest.scss";
import * as XLSX from 'xlsx';
import RORequestsOps from "../../service/BAL/SPCRUD/RO";
import ReleaseOrderRequestsOps from "../../service/BAL/SPCRUD/ReleaseOrder";
import { formatAmount } from "../../service/BAL/SPCRUD/Helper";

interface RORow {
  ReqNo: string;
  InitiatorName: string;
  Status: string;
  NextApprover: string;
  ROFrom: string;
  ROEndDate: string;
  ROAmount: number;
}

interface POWiseRow {
  PONumber: string;
  VendorName: string;
  Department: string;
  CostCenter: string;
  POStartDate: string;
  POEndDate: string;
  POAmount: number;
  BalanceAmount: number;
  ROList: RORow[];
}


export const POWiseROReport: React.FC<IMgMotorProdProps> = (props: IMgMotorProdProps) => {

    const [searchTerm, setSearchTerm] = useState("");
    const [ROData, setROData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilterPopup, setShowFilterPopup] = useState(false);
    const [MovementDropdown, setMovementDropdown] = useState<any[]>([]);
    const [recordsPerPage, setRecordsPerPage] = useState(10); // default 10 records per page
    const [poWiseData, setPoWiseData] = useState<POWiseRow[]>([]);
    const [expandedPOs, setExpandedPOs] = useState<Set<string>>(new Set());

    const [filterInputs, setFilterInputs] = useState({
        ageing: "",
        movementType: "",
        approvalNoteYear: "",
    });

    const [columnFilters, setColumnFilters] = useState({
        PONumber: "",
        VendorName: "",
        Department: "",
        CostCenter: "",
        POStartDate: "",
        POEndDate: ""
    });

    const resetFilters = () => {
        setColumnFilters({
            PONumber: "",
            VendorName: "",
            Department: "",
            CostCenter: "",
            POStartDate: "",
            POEndDate: ""
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

    const togglePO = (poKey: string) => {
        setExpandedPOs(prev => {
            const next = new Set(prev);
            next.has(poKey) ? next.delete(poKey) : next.add(poKey);
            return next;
        });
    };

    const expandAll = () => {
        setExpandedPOs(
            new Set(poWiseData.map(po => `${po.PONumber}_${po.CostCenter}`))
        );
    };

    const collapseAll = () => {
        setExpandedPOs(new Set());
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

    // const GetROData = async () => {
    //     await EmployeeProfile(props.userEmail);
    //     setLoading(true);
    //     const ROColl = await RORequestsOps().getIROData(
    //         { column: "ID", isAscending: false },
    //         props,
    //         ''
    //     );
    //     let ROCollFilter = ROColl.filter((test) => test.Status != "Draft" && test.Status != "Withdrawn" && test.Status != "Reject");
    //     const normalizedRO = ROCollFilter.map((ro) => {
    //         let poNumber = "-";

    //         try {
    //             const poArr = JSON.parse(ro.PODetails);
    //             poNumber = poArr?.[0]?.PONumber ?? "-";
    //         } catch (err) {
    //             console.warn("Invalid PODetails JSON for RO ID:", ro.ID);
    //         }

    //         return {
    //             ...ro,
    //             PONumber: poNumber,
    //         };
    //     });

    //     console.log('RO data: ', ROCollFilter);// Debug log
    //     setROData(normalizedRO);
    //     const poData = buildPOWiseData(normalizedRO);
    //     setPoWiseData(poData);
    //     setFilteredData(normalizedRO);
    //     setLoading(false);
    // };

    // const buildPOWiseData = (roList: any[]): POWiseRow[] => {
    //     const poMap = new Map<string, POWiseRow>();

    //     roList.forEach(ro => {
    //         let po;
    //         try {
    //         po = JSON.parse(ro.PODetails)?.[0];
    //         } catch {
    //         return;
    //         }

    //         const key = `${po.PONumber}_${po.CostCenter}`;

    //         if (!poMap.has(key)) {
    //         poMap.set(key, {
    //             PONumber: po.PONumber,
    //             VendorName: po.VendorName,
    //             CostCenter: po.CostCenter,
    //             POStartDate: po.POStartDate,
    //             POEndDate: po.POEndDate,
    //             POAmount: Number(po.POAmount) || 0,
    //             BalanceAmount: Number(po.POAmount) || 0,
    //             ROList: []
    //         });
    //         }

    //         const poRow = poMap.get(key)!;

    //         const roAmount = Number(ro.ROAmount) || 0;

    //         poRow.ROList.push({
    //         ReqNo: ro.ReqNo,
    //         InitiatorName: ro.InitiatorName,
    //         Status: ro.Status,
    //         NextApprover: ro.NextApprover ?? "-",
    //         ROFrom: ro.ROFrom,
    //         ROEndDate: ro.ROEndDate,
    //         ROAmount: roAmount
    //         });

    //         poRow.BalanceAmount -= roAmount;
    //     });

    //     return Array.from(poMap.values());
    //     };

    const GetPODashboardData = async () => {
        try {
            setLoading(true);

            // 🔹 1️⃣ Fetch PO Master List
            const poList = await ReleaseOrderRequestsOps().getPOData(
            { column: "ID", isAscending: false },
            props,
            ""
            );

            // 🔹 2️⃣ Fetch RO List
            let roList = await RORequestsOps().getIROData(
            { column: "ID", isAscending: false },
            props,
            ""
            );

            // 🔹 3️⃣ Filter unwanted statuses
            roList = roList.filter(
            r =>
                r.Status !== "Draft" &&
                r.Status !== "Withdrawn" &&
                r.Status !== "Reject"
            );

            // 🔹 4️⃣ Create RO Map (optimized lookup)
            const roMap = new Map<string, RORow[]>();

            roList.forEach(ro => {
            try {
                const poData = JSON.parse(ro.PODetails)?.[0];
                if (!poData) return;

                const key = `${poData.PONumber}_${poData.CostCenter}`;

                const roAmount = Number(ro.ROAmount) || 0;

                const roItem: RORow = {
                ReqNo: ro.ReqNo,
                InitiatorName: ro.InitiatorName,
                Status: ro.Status,
                NextApprover: ro.NextApprover ?? "-",
                ROFrom: ro.ROFrom,
                ROEndDate: ro.ROEndDate,
                ROAmount: roAmount
                };

                if (!roMap.has(key)) {
                roMap.set(key, []);
                }

                roMap.get(key)!.push(roItem);
            } catch {
                console.warn("Invalid PODetails JSON for RO:", ro.ID);
            }
            });

            // 🔹 5️⃣ Build Final PO Wise Data (Master Driven)
            const finalPOData: POWiseRow[] = poList.map(po => {
            const key = `${po.PONumber}_${po.CostCenter}`;

            const roItems = roMap.get(key) || [];

            const usedAmount = roItems.reduce(
                (sum, r) => sum + (Number(r.ROAmount) || 0),
                0
            );

            const poAmount = Number(po.POAmount) || 0;

            return {
                PONumber: po.PONumber,
                VendorName: po.VendorName,
                Department: po.Department,
                CostCenter: po.CostCenter,
                POStartDate: po.POStartDate,
                POEndDate: po.POEndDate,
                POAmount: poAmount,
                BalanceAmount: poAmount - usedAmount,
                ROList: roItems
            };
            });

            setPoWiseData(finalPOData);
            setFilteredData(finalPOData);

        } catch (error) {
            console.error("Error loading PO Dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        GetPODashboardData();

    }, []);

    useEffect(() => {
        if (poWiseData.length > 0) {
            const savedState = sessionStorage.getItem('dashboardState');

            if (!savedState) return;

            try {
                const saved = JSON.parse(savedState);

                setSearchTerm(saved.searchTerm ?? '');
                setColumnFilters(saved.columnFilters ?? {});
                setCurrentPage(saved.currentPage ?? 1);
                setFilterInputs(saved.filterInputs ?? {});

                sessionStorage.removeItem('dashboardState');

            } catch (error) {
                console.error("Invalid dashboardState in sessionStorage", error);
            }
        }
    }, [poWiseData]);


    //Filter Search based on each column 
    useEffect(() => {
        let filtered = poWiseData;
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
    }, [columnFilters, poWiseData]);

    //filter based on search
    useEffect(() => {
        if (!searchTerm) {
            setFilteredData(poWiseData);
        } else {
            const lowerSearch = searchTerm.toLowerCase();
            const filtered = poWiseData.filter(po =>
                po.PONumber?.toLowerCase().includes(lowerSearch) ||
                po.VendorName?.toLowerCase().includes(lowerSearch) ||
                po.Department?.toLowerCase().includes(lowerSearch) ||
                po.CostCenter?.toLowerCase().includes(lowerSearch) ||
                po.POStartDate?.toLowerCase().includes(lowerSearch) ||
                po.POEndDate?.toLowerCase().includes(lowerSearch) 
            );
            setFilteredData(filtered);
            setCurrentPage(1);
        }
    }, [searchTerm, poWiseData]);  // ✅ added ROData

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
        const exportData = dataToExport.map((po) => ({
            "PO Number": po.PONumber,
            "Vendor Name": po.VendorName,
            "Department": po.Department,
            "Cost Center": po.CostCenter,
            "PO Start Date": po.POStartDate,
            "PO End Date": po.POEndDate,
            "PO Amount": formatAmount(po.POAmount),
            "Balance Amount": po.BalanceAmount,
            "No. of ROs": po.ROList.length
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
                        <h2>PO Wise RO Report</h2>
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
                            <button className="btn btn-warning export-btn" type="button" onClick={expandAll} style={{ marginLeft: "10px" }}>Expand</button>
                            <button className="btn btn-warning export-btn" type="button" onClick={collapseAll} style={{ marginLeft: "10px" }}>Collapse</button>
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
                                          <th></th> {/* expand icon */}
                                          <th className="px-4 py-2">PO Number</th>
                                          <th className="px-4 py-2">Vendor Name</th>
                                          <th className="px-4 py-2">Department</th>
                                          <th className="px-4 py-2">Cost Center</th>
                                          <th className="px-4 py-2">PO Start Date</th>
                                          <th className="px-4 py-2">PO End Date</th>
                                          <th className="px-4 py-2">PO Amount</th>
                                          <th className="px-4 py-2">Balance Amount</th>
                                        </tr>
                                        <tr className="bg-gray-100 text-black">
                                            <th></th>
                                            {["PONumber", "VendorName", "Department", "CostCenter", "POStartDate", "POEndDate", "POAmount", "BalanceAmount"].map((col) => (
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
                                        {filteredData.map((po) => {
                                          const poKey = `${po.PONumber}_${po.CostCenter}`;
                                          const isExpanded = expandedPOs.has(poKey);

                                          return (
                                            <React.Fragment key={poKey}>
                                              {/* PO ROW */}
                                              <tr className="border-t">
                                                <td
                                                  className="px-4 py-2"
                                                  onClick={() => togglePO(poKey)}
                                                >
                                                  <i className={`fa ${isExpanded ? "fa-minus-square" : "fa-plus-square"}`} />
                                                </td>

                                                <td className="px-4 py-2">{po.PONumber}</td>
                                                <td className="px-4 py-2">{po.VendorName}</td>
                                                <td className="px-4 py-2">{po.CostCenter}</td>
                                                <td className="px-4 py-2">{po.Department}</td>
                                                <td className="px-4 py-2">{formatDate(po.POStartDate)}</td>
                                                <td className="px-4 py-2">{formatDate(po.POEndDate)}</td>
                                                <td className="px-4 py-2">{formatAmount(po.POAmount)}</td>
                                                <td className="px-4 py-2">{formatAmount(po.BalanceAmount)}</td>
                                              </tr>
                                              {isExpanded && (
                                                <tr>
                                                  <td colSpan={8} className="bg-white px-8 py-4">
                                                    <table className="min-w-full bg-white rounded-2xl shadow-md">
                                                      <thead style={{ backgroundColor: "#ce0b0e", top: "0px" }} className="text-white">
                                                        <tr>
                                                          <th className="px-4 py-2">Req No</th>
                                                          <th className="px-4 py-2">Initiator</th>
                                                          <th className="px-4 py-2">Status</th>
                                                          <th className="px-4 py-2">Next Approver</th>
                                                          <th className="px-4 py-2">RO From</th>
                                                          <th className="px-4 py-2">RO End Date</th>
                                                          <th className="px-4 py-2">Amount</th>
                                                        </tr>
                                                      </thead>

                                                      <tbody>
                                                        {po.ROList.map((ro, i) => (
                                                          <tr key={i}>
                                                            <td className="px-4 py-2">{ro.ReqNo}</td>
                                                            <td className="px-4 py-2">{ro.InitiatorName}</td>
                                                            <td className="px-4 py-2">{ro.Status}</td>
                                                            <td className="px-4 py-2">{ro.NextApprover}</td>
                                                            <td className="px-4 py-2">{ro.ROFrom}</td>
                                                            <td className="px-4 py-2">{formatDate(ro.ROEndDate)}</td>
                                                            <td className="px-4 py-2">{formatAmount(ro.ROAmount)}</td>
                                                          </tr>
                                                        ))}

                                                        {/* TOTAL ROW */}
                                                        <tr>
                                                          <td colSpan={6} className="px-4 py-2 text-right">Total</td>
                                                          <td className="px-4 py-2">
                                                            {formatAmount(
                                                              po.ROList.reduce((sum, r) => sum + r.ROAmount, 0)
                                                            )}
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              )}
                                            </React.Fragment>
                                          );
                                        })};

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

export default POWiseROReport;
