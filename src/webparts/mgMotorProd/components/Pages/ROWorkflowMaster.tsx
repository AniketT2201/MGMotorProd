import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Formik, Form, Field, FormikProps } from "formik";
import { IMgMotorProdProps } from '../IMgMotorProdProps';
// import IASRequestsOps from "../../service/BAL/SPCRUD/PTU";
import USESPCRUD, { ISPCRUD } from '../../service/BAL/SPCRUD/spcrud';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import IParametersOps from "../../service/BAL/SPCRUD/Parameters";
import SPCRUDOPS from "../../service/DAL/spcrudops";
import { useHistory, Link } from 'react-router-dom';
import './CSS/NewRequest.scss';
import { format } from 'date-fns';
import { faL } from "@fortawesome/free-solid-svg-icons";

import Pencil from "../../assets/Pencil.png";
import Delete from "../../assets/delete.png";

// import "./NewRequest.css";

export const ROWorkflowMaster: React.FC<IMgMotorProdProps> = (props: IMgMotorProdProps) => {
    const formikRef = useRef<FormikProps<FormValues>>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [DepartmentData, setDepartmentData] = useState([]);
    const [CompanyLocationData, setLocationData] = useState([]);
    const [finMgrData, setFinMgrData] = useState([]);
    const [WorkflowData, setWorkflowData] = useState([]);
    const [showModalAddNew, setShowModalAddNew] = useState(false);
    const [showModalEdit, setshowModalEdit] = useState(false);
    const [loading, setLoading] = useState(true);
    const [DepartmentMainData, setDepartmentMainData] = useState([]);
    const [ItemID, setItemID] = useState<any>();
    const [editDepartmentName, setEditDepartmentName] = useState("");


    const filteredData = WorkflowData.filter(x =>
        x.Department?.Department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    //Global Variables
    // let EmployeeProfiledata = useRef<string[]>([]);;
    // Pagination
    const itemsPerPage = 10;
    const [currentPage, setCurrentPage] = useState(1);
    // const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const totalPages = Math.ceil((filteredData?.length || 0) / itemsPerPage) || 1;
    const history = useHistory();
    const initialvalues =
    {
        Department: '',
        CompanyLocation: '',
        LowerLimit: '',
        UpperLimit: '',
        userName: '',
    };
    interface FormValues {
        Department: string,
        CompanyLocation: any,
        LowerLimit: any,
        UpperLimit: any,
        userName: any,
    }
    let spCrudObj: ISPCRUD;
    useEffect(() => {
        fetchData();

    }, []);
    const fetchData = async () => {
        try {
            setLoading(true);

            const sp = await SPCRUDOPS();
            /** Departments */
            const dept = await sp.getRootData(
            "Departments",
            "ID,Department",
            "",
            "",
            {column:"ID",isAscending:true},
            props
            );

            /** Company Location */
            const loc = await sp.getRootData(
            "CompanyLocation",
            "ID,Title,CompanyLocation",
            "",
            "",
            {column:"ID",isAscending:true},
            props
            );

            /** ROACL -> FinMgr */
            const finMgr = await sp.getData(
            "ROACL",
            "*,ID,Title,Role,UserName/Id,UserName/Title,UserName/EMail",
            "UserName",
            `Role eq 'FinMgr'`,
            {column:"ID",isAscending:true},
            props
            );

            /** Workflow data */
            const wf = await sp.getRootData(
            "ROWorkFlow",
            "*,CompanyLocation/Id,CompanyLocation/CompanyLocation,Department/Id,Department/Department,UserName/Id,UserName/Title,UserName/EMail",
            "UserName,CompanyLocation,Department",
            "",
            {column:"ID",isAscending:false},
            props
            );

            setDepartmentData(dept);
            setLocationData(loc);
            setFinMgrData(finMgr);
            setWorkflowData(wf);

        } catch (error) {
            console.error("Failed to fetch ACL data:", error);
        } finally {
            setLoading(false);
        }
    };

    const deleteDepartment = async (id:number) => {
        if (!window.confirm("Do You Want to Delete this record?")) return;
        const sp = await SPCRUDOPS();
        setLoading(true);
        try {
            await sp.deleteRootData("ROWorkFlow", id, props);
            alert("Request deleted successfully.");
            fetchData();
        } catch (error) {
            console.error("Error deleting department:", error);
            alert("Failed to delete department. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    const editDepartment = (item:any) => {
        setshowModalEdit(true);
        setItemID(item.ID);
        setEditDepartmentName(item.Department?.Department);
        formikRef.current?.setValues({
            Department: item.Department?.Id || '',
            CompanyLocation: item.CompanyLocation?.Id || '',
            LowerLimit: item.LowerLimit,
            UpperLimit: item.UpperLimit,
            userName: item.UserName?.Id || '',
        });
    };
    const saveupdateDepartment = async () => {
        const sp = await SPCRUDOPS();
        setLoading(true);
        try {
            await sp.updateRootData("ROWorkFlow",ItemID,{
                DepartmentId: Number(formikRef.current?.values.Department),
                CompanyLocationId: Number(formikRef.current?.values.CompanyLocation) || null,
                LowerLimit: formikRef.current?.values.LowerLimit,
                UpperLimit: formikRef.current?.values.UpperLimit,
                UserNameId: Number(formikRef.current?.values.userName) || null,
            },props);
            alert("Request updated successfully.");
            setshowModalEdit(false);
            fetchData();
        } catch (error) {
            console.error("Error updating department:", error);
            alert("Failed to update department. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    const saveDepartment = async () => {
        const sp = await SPCRUDOPS();
        const dept = Number(formikRef.current?.values.Department);
        setLoading(true);
        try {
            if(!dept){
            alert("Select Department");
            return;
            }
            await sp.insertRootData("ROWorkFlow",{
                DepartmentId: Number(dept),
            },props);
            alert("Department added successfully.");
            setShowModalAddNew(false);
            fetchData();
        } catch (error) {
            console.error("Error adding department:", error);
            alert("Failed to add department. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const modalAddComponent = () => {
        setShowModalAddNew(true);

        // loadTemplate1()
    };
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };


    return (
        <Formik initialValues={initialvalues} innerRef={formikRef} onSubmit={() => {}}>
            <div className="min-h-screen bg-gray-100" style={{backgroundColor : "#fff"}}>
                <div className="header">
                    <div className="left-banner">
                        <div className="logo-text">
                            <h2>ROWorkFlow Master</h2>
                        </div>
                    </div>
                </div>
                <div style={{ margin: "10px 5px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button className="btn btn-warning btn-init" type="button" onClick={modalAddComponent} style={{ backgroundColor: ' #030397',border : "none" }}>
                        <i className="fa fa-save"></i> Add New Department
                    </button>
                    <div className="Dashboard-Search">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2"
                            style={{ width: "190px", boxShadow: "rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px", border: "none" }}
                        />
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

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white rounded-2xl shadow-md">
                                    <thead style={{ backgroundColor: "#ce0b0e" }}
                                        className="text-white">
                                        <tr>
                                            <th className="px-4 py-2">Department</th>
                                            <th className="px-4 py-2">CompanyLocation</th>
                                            <th className="px-4 py-2">LowerLimit</th>
                                            <th className="px-4 py-2">UpperLimit</th>
                                            <th className="px-4 py-2">userName</th>
                                            <th className="px-4 py-2">Edit </th>
                                            <th className="px-4 py-2">Delete</th>

                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredData != undefined ? filteredData.sort((a, b) => b.ID - a.ID).slice(
                                            (currentPage - 1) * itemsPerPage,
                                            currentPage * itemsPerPage).map((item) =>
                                                <tr className="border-t" key={item.ID}>

                                                    <td className="px-4 py-2">{item.Department?.Department}
                                                    </td>
                                                    <td className="px-4 py-2">{item.CompanyLocation?.CompanyLocation}
                                                    </td>
                                                    <td className="px-4 py-2">{item.LowerLimit}
                                                    </td>
                                                    <td className="px-4 py-2">{item.UpperLimit}
                                                    </td>
                                                    <td className="px-4 py-2">{item.UserName?.Title}
                                                    </td>
                                                    <td className="text-center">
                                                        <a onClick={(e) => editDepartment(item)}>
                                                            <img src={Pencil} alt="" width={15} height={15} />
                                                        </a>
                                                    </td>
                                                    <td className="text-center small-action-column">
                                                         <a onClick={(e) => deleteDepartment(item.ID)}>
                                                            <img src={Delete} alt="" width={15} height={15}/>
                                                        </a>
                                                    </td>

                                                </tr>
                                            ) : []}

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
                            {showModalAddNew && (
                                <div className="modal-backdrop">
                                    <div className="modal-contentone">
                                        <h4>Add New Department</h4>

                                        <div className="form-group">
                                            <label>Department</label>
                                            <Field as="select" name="Department" default='' className="form-control">
                                                <option value="">Select</option>
                                                {DepartmentData?.map((Vend1) => (
                                                    <option key={Vend1.ID} value={Vend1.ID}>
                                                        {Vend1.Department}
                                                    </option>
                                                ))}
                                            </Field>

                                        </div>

                                        <div className="modal-actions">
                                            <button className="btn btn-secondary" onClick={()=>setShowModalAddNew(false)}>Close</button>
                                            <button className="btn btn-primary" onClick={saveDepartment} >ok</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {showModalEdit && (
                                <div className="modal-backdrop">
                                    <div className="modal-contentone">
                                        <h4>Edit ROWorkFlow Details</h4>

                                        <div className="form-group">
                                            <label>Department</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                readOnly
                                                value={editDepartmentName}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>CompanyLocation</label>
                                            <Field as="select" name="CompanyLocation" className="form-control">
                                                <option value="">Select</option>
                                                {CompanyLocationData?.map((loc) => (
                                                    <option key={loc.ID} value={loc.ID}>
                                                        {loc.CompanyLocation}
                                                    </option>
                                                ))}
                                            </Field>
                                        </div>
                                        <div className="form-group">
                                            <label>LowerLimit</label>
                                            <Field type="number" name="LowerLimit" className="form-control" />
                                        </div>
                                        <div className="form-group">
                                            <label>UpperLimit</label>
                                            <Field type="number" name="UpperLimit" className="form-control" />
                                        </div>
                                        <div className="form-group">
                                            <label>userName</label>
                                            <Field as="select" name="userName" className="form-control">
                                                <option value="">Select</option>
                                                {finMgrData.map(f=>(
                                                    <option key={f.UserName?.Id} value={f.UserName?.Id}>
                                                        {f.UserName?.Title}
                                                    </option>
                                                ))}
                                            </Field>
                                        </div>

                                        <div className="modal-actions">
                                            <button className="btn btn-secondary" onClick={()=>setshowModalEdit(false)}>Close</button>
                                            <button className="btn btn-primary" onClick={saveupdateDepartment} >ok</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div >
        </Formik>
    );
};

export default ROWorkflowMaster;
