import * as React from "react";
import { useState, useEffect, useRef } from "react";
import type { IMgMotorProdProps } from "../IMgMotorProdProps";
import SPCRUDOPS from "../../service/DAL/spcrudops";
import { useHistory } from 'react-router-dom';
import { Formik, Form, Field, FormikProps } from "formik";
import USESPCRUD, { ISPCRUD } from '../../service/BAL/SPCRUD/spcrud';
import "../Pages/CSS/NewRequest.scss";
import { sp } from "@pnp/sp";
import { FontSizes } from "@fluentui/react";
interface FormValues {
    CostCenter: any,
    Plant: any,
    Description: any,
    Department: any,
    ccowner: any,
    finapprover: any,
    remarks: any
}
export const CostCenter: React.FC<IMgMotorProdProps> = (props: IMgMotorProdProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [IASData, setIASData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForwardNew, setForwardNew] = useState(false);
    const [CCOwnerOptions, setCCOwnerOptions] = useState([]);
    const [FinApproverOptions, setFinApproverOptions] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [ItemID, setItemID] = useState(null);

    const itemsPerPage = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const history = useHistory();

    const handleTitleClick = (id) => {
        history.push({
            pathname: '/ApprovalForm',
            search: `?ItemId=${id}`,
            state: { from: '/Dashboard' }
        }
        );
    };

    const dateDifference = (fromDt: Date, toDt: Date) => {
        let diff: any = new Date(toDt.getTime() - fromDt.getTime());
        let days = diff / 1000 / 60 / 60 / 24;
        return days.toFixed(0);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB'); // This gives dd/mm/yyyy format
    };

    const GetIASData = async () => {
        setLoading(true);
        const spCrudOps = await SPCRUDOPS();
        const CostCenterdata = await spCrudOps.getData(
            'CostCenter',
            'ID,Title,Plant,Description,Department,CCOwner/Title,CCOwner/EMail,FinApprover/Title,FinApprover/EMail,Remarks',
            'CCOwner,FinApprover',
            '',
            { column: 'ID', isAscending: true },
            props
        );
        setIASData(CostCenterdata);
        setFilteredData(CostCenterdata);
        setLoading(false);
    };

    useEffect(() => {
        GetIASData();
        getdropdowndata();
    }, []);

    async function getdropdowndata() {
        const spCrudOps = await SPCRUDOPS();
        const CostCenterdata = await spCrudOps.getData(
            'IAS_ACL',
            'ID,Title,UserName/Title,UserName/EMail,Role',
            'UserName',
            '',
            { column: 'ID', isAscending: true },
            props
        );
        setFinApproverOptions(CostCenterdata);
        setCCOwnerOptions(CostCenterdata);
    }
    
    async function EditRequest(item) {
        // console.log(Test);
        setForwardNew(true);
        setItemID(item.ID);
        setSelectedItem(item);

        formikRef.current?.setValues({
            CostCenter: item.Title || "",
            Plant: item.Plant || "",
            Description: item.Description || "",
            Department: item.Department || "",
            ccowner: item.CCOwner?.EMail || "",
            finapprover: item.FinApprover?.EMail || "",
            remarks: item.Remarks || ""
        });
    }
    async function CANCEL() {
        setForwardNew(false);
    }
    async function Delete() {
        setForwardNew(false);
    }
    const resolveUserId = async (email) => {
        if (!email) return null;        
        const user = await getuserdata(email);
        console.log(user.data.Id);
        return user.data.Id;
    };

    //get user data
    const getuserdata = async (mail) => {
        sp.setup({
            sp: {
                baseUrl: props.currentSPContext.pageContext.web.absoluteUrl
            },
        });

        const result = await sp.web.ensureUser(`i:0#.f|membership|` + mail);
        console.log(result);
        return result;
    }

    const OK = async () => {
        const values = formikRef.current.values;

        const payload = {
            Title: values.CostCenter,
            Plant: values.Plant,
            Description: values.Description,
            Department: values.Department,
            CCOwnerId: await resolveUserId(values.ccowner),
            FinApproverId: await resolveUserId(values.finapprover),
            Remarks: values.remarks
        };

        const spCrudObj = await USESPCRUD();
        await spCrudObj.updateData("CostCenter", ItemID, payload, props);
        setForwardNew(false);
    };

    useEffect(() => {
        if (!searchTerm) {
            setFilteredData(IASData);
        } else {
            const lowerSearch = searchTerm.toLowerCase();
            const filtered = IASData.filter(item =>
                item.Title?.toLowerCase().includes(lowerSearch) ||
                item.Author?.toLowerCase().includes(lowerSearch) ||
                item.Department?.toLowerCase().includes(lowerSearch) ||
                item.Status?.toLowerCase().includes(lowerSearch) ||
                item.Author?.toLowerCase().includes(lowerSearch) ||
                item.Department?.toLowerCase().includes(lowerSearch) ||
                formatDate(item.Created)?.toLowerCase().includes(lowerSearch) ||
                item.MovementType?.toLowerCase().includes(lowerSearch) ||
                item.MovementReason?.toLowerCase().includes(lowerSearch) ||
                item.CostCenter?.toLowerCase().includes(lowerSearch) ||
                item.GrossValue?.toLowerCase().includes(lowerSearch) ||
                item.NetValue?.toLowerCase().includes(lowerSearch) ||
                item.Status?.toLowerCase().includes(lowerSearch) ||
                item.NATitle?.toLowerCase().includes(lowerSearch) ||
                item.DATitle?.toLowerCase().includes(lowerSearch)
            );
            setFilteredData(filtered);
            setCurrentPage(1);
        }
    }, [searchTerm, IASData]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const formikRef = useRef<FormikProps<FormValues>>(null);
    const initialvalue = {
        CostCenter: "",
        Plant: "",
        Description: "",
        Department: "",
        ccowner: "",
        finapprover: "",
        remarks: ""
    };

    return (
        <Formik initialValues={initialvalue} innerRef={formikRef} onSubmit={() => {}}>
            <Form>
                <div className="min-h-screen bg-gray-100">
                    <div className="header">
                        <div className="left-banner">
                            <div className="logo-text">
                                <h2>Configure Cost Center</h2>
                            </div>
                        </div>
                    </div>

                    <main className="p-6">
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
                                <div
                                    className="Dashboard-Search"
                                >
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-64 px-4 py-2 text-sm border border-gray-300 rounded-full shadow focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>

                                {/* Table */}
                                <div className="overflow-x-auto">
                                    <div className="table-vert-scroll">
                                        <table className="min-w-full bg-white rounded-2xl shadow-md">
                                            <thead style={{ backgroundColor: "#ce0b0e" }}
                                                className="text-white"
                                            >
                                                <tr>
                                                    <th className="px-4 py-2"></th>
                                                    <th className="px-4 py-2">Cost center</th>
                                                    <th className="px-4 py-2">Plant</th>
                                                    <th className="px-4 py-2">Description</th>
                                                    <th className="px-4 py-2">Department</th>
                                                    <th className="px-4 py-2">Cost Centre Owner</th>
                                                    <th className="px-4 py-2">Finance Approvers</th>
                                                    <th className="px-4 py-2">Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedData.map((item, index) => (
                                                    <tr key={index} className="border-t">
                                                        <td className="px-4 py-2"><button className="btn btn-warning btn-init" type="button" onClick={() => EditRequest(item)}><i className="fa fa-mail-forward"></i> Edit</button></td>
                                                        <td className="px-4 py-2">{item.Title}</td>
                                                        <td className="px-4 py-2">{item.Plant}</td>
                                                        <td className="px-4 py-2">{item.Description}</td>
                                                        <td className="px-4 py-2">{item.Department}</td>
                                                        <td className="px-4 py-2">{item.CCOwner?.Title}</td>
                                                        <td className="px-4 py-2">{item.FinApprover?.Title}</td>
                                                        <td className="px-4 py-2">{item.Remarks}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    <div className="flex justify-center mt-6 overflow-x-auto">
                                        <div className="flex space-x-2 flex-nowrap px-4 py-2 bg-orange rounded shadow">

                                            {/* Previous Button */}
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                style={{
                                                    backgroundColor: "orange",
                                                    color: "black",
                                                    opacity: currentPage === 1 ? 0.5 : 1,
                                                }}
                                                className="px-3 py-1 border rounded"
                                            >
                                                Previous
                                            </button>

                                            {/* First Page Shortcut */}
                                            {currentPage > 3 && (
                                                <>
                                                    <button
                                                        onClick={() => handlePageChange(1)}
                                                        style={{
                                                            backgroundColor: "orange",
                                                            color: "black",
                                                        }}
                                                        className="px-3 py-1 border rounded"
                                                    >
                                                        1
                                                    </button>
                                                    <span className="px-2">...</span>
                                                </>
                                            )}

                                            {/* Main Page Numbers */}
                                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                .filter((page) => Math.abs(page - currentPage) <= 2)
                                                .map((page) => (
                                                    <button
                                                        key={page}
                                                        onClick={() => handlePageChange(page)}
                                                        style={{
                                                            backgroundColor: currentPage === page ? "yellow" : "orange",
                                                            color: "black",
                                                            fontWeight: currentPage === page ? "bold" : "normal"
                                                        }}
                                                        className="px-3 py-1 border rounded"
                                                    >
                                                        {page}
                                                    </button>
                                                ))}

                                            {/* Last Page Shortcut */}
                                            {currentPage < totalPages - 2 && (
                                                <>
                                                    <span className="px-2">...</span>
                                                    <button
                                                        onClick={() => handlePageChange(totalPages)}
                                                        style={{
                                                            backgroundColor: "orange",
                                                            color: "black",
                                                        }}
                                                        className="px-3 py-1 border rounded"
                                                    >
                                                        {totalPages}
                                                    </button>
                                                </>
                                            )}

                                            {/* Next Button */}
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                style={{
                                                    backgroundColor: "orange",
                                                    color: "black",
                                                    opacity: currentPage === totalPages ? 0.5 : 1,
                                                }}
                                                className="px-3 py-1 border rounded"
                                            >
                                                Next
                                            </button>

                                        </div>
                                    </div>
                                </div>

                                {showForwardNew && (
                                    <>
                                        <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-hidden="false">
                                            <div className="modal-dialog modal-lg">
                                                <div className="modal-content">
                                                    <div className="modal-body">
                                                        {/* Hidden Inputs (if needed) */}
                                                        <input type="hidden" name="docID" />
                                                        <input type="hidden" name="reqType" />

                                                        {/* Structured Form Layout */}
                                                        <table className="table table-bordered">
                                                            <colgroup>
                                                                <col style={{ width: '30%' }} />
                                                                <col style={{ width: '70%' }} />
                                                            </colgroup>

                                                            <tbody>
                                                                <tr>
                                                                    <th>Cost Center</th>
                                                                    <td>
                                                                        <Field name="CostCenter" type="text" className="form-control input-box" />
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <th>Plant</th>
                                                                    <td>
                                                                        <Field name="Plant" type="text" className="form-control input-box" />
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <th>Description</th>
                                                                    <td>
                                                                        <Field name="Description" type="text" className="form-control input-box" />
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <th>Department</th>
                                                                    <td>
                                                                        <Field name="Department" type="text" className="form-control input-box" />
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <th>CCOwner</th>
                                                                    <td>
                                                                        <Field as="select" name="ccowner" className="form-control input-box" style={{ fontSize: 'small' }}>
                                                                            <option value="">Select</option>
                                                                            {CCOwnerOptions?.map((owner) => (
                                                                                <option key={owner.UserName.EMail} value={owner.UserName.EMail}>
                                                                                    {owner.UserName.Title}
                                                                                </option>
                                                                            ))}
                                                                        </Field>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <th>FinApprover</th>
                                                                    <td>
                                                                        <Field as="select" name="finapprover" className="form-control input-box" style={{ fontSize: 'small' }}>
                                                                            <option value="">Select</option>
                                                                            {FinApproverOptions?.map((approver) => (
                                                                                <option key={approver.UserName.EMail} value={approver.UserName.EMail}>
                                                                                    {approver.UserName.Title}
                                                                                </option>
                                                                            ))}
                                                                        </Field>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <th>Remarks</th>
                                                                    <td>
                                                                        <Field name="remarks" type="text" className="form-control input-box" />
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* Modal Footer */}
                                                    <div className="modal-footer">
                                                        <button type="button" className="btn btn-danger d-none" onClick={Delete}><i className="fa fa-trash-o"></i> Delete</button>
                                                        <button type="button" className="btn btn-primary" onClick={OK}>OK</button>
                                                        <button type="button" className="btn btn-secondary" onClick={CANCEL}>Cancel</button>
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
                </div >
            </Form>
        </Formik >
    );
};

export default CostCenter;
