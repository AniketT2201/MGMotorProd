import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Formik, Form, Field, FormikProps, useFormikContext } from "formik";
import * as XLSX from 'xlsx';
import type { IMgMotorProdProps } from "../IMgMotorProdProps";
import IASRequestsOps from "../../service/BAL/SPCRUD/RO";
import '../Pages/CSS/NewRequest.scss';
import SPCRUDOPS from "../../service/DAL/spcrudops";
import { useHistory } from 'react-router-dom';
import { ReorderingRuleMatchType } from '@pnp/sp/search';
import { RoleType } from '@pnp/sp/sharing';
import USESPCRUD, { ISPCRUD } from '../../service/BAL/SPCRUD/spcrud';
import Select from 'react-select';
import { values } from 'office-ui-fabric-react';

interface FormValues {
    user: any;
    Department: any;
    RoleType?: string;
    roleType: any;
}

export const formatDate = (date: Date | string): string => {
    const parsed = typeof date === 'string' ? new Date(date) : date;
    return format(parsed, 'dd/MM/yyyy');
};

export const dateDifference = (from: Date | string, to: Date | string = new Date()): string => {
    const fromDate = typeof from === 'string' ? new Date(from) : from;
    const toDate = typeof to === 'string' ? new Date(to) : to;
    return differenceInDays(toDate, fromDate).toString();
};

export const PartwiseReport: React.FC<IMgMotorProdProps> = (props: IMgMotorProdProps) => {

    const [IASData, setIASData] = useState<any[]>([]);
    const [ACL_UserData, setACL_UserData] = useState<any[]>([]);
    const [detailsData, setDetailsData] = useState<any[]>([]);
    const [dropdownValue, setDropdownValue] = useState(null);
    const [loading, setLoading] = useState(false);
    const [popupVisible, setPopupVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const history = useHistory();
    const paginatedData = detailsData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(detailsData.length / itemsPerPage);
    const formikRef = useRef<FormikProps<FormValues>>(null);
    const initialvalue = {
        user: '',
        Department: '',
        RoleType: '',
        roleType: ''
    }

    const FormikReactSelect = ({ name, options }) => {
        const { setFieldValue, values } = useFormikContext();

        // const selectOptions = options.map(user => ({
        //     value: user.ID,
        //     label: user.UserName.Title
        // }));

        const selectOptions = options
            .filter(user =>
                user?.ID &&
                user?.UserName?.Title
            )
            .map(user => ({
                value: user.ID,
                label: user.UserName.Title
            }));

        const selectedOption = selectOptions.find(
            opt => opt.value === values[name]
        ) || null;

        return (
            <Select
                name={name}
                value={selectedOption}
                onChange={(selected) => setFieldValue(name, selected ? selected.value : '')}
                options={selectOptions}
                placeholder="Search and select user..."
                isClearable
                styles={{
                    container: base => ({
                        ...base,
                        minWidth: '300px',
                        fontSize: '14px'
                    }),
                    control: base => ({
                        ...base,
                        borderColor: '#ccc',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    })
                }}
            />
        );
    };

    useEffect(() => {
        const selected = options.find(opt => opt.value === formikRef.current?.values?.roleType);
        setDropdownValue(selected || null);
    }, [formikRef.current?.values?.roleType]);

    type RawOption = {
        value: string;
        Title: string;
    };

    const dropdownOptions: RawOption[] = [
        { value: "", Title: "Select Type" },
        { value: "Approvers", Title: "Approvers" },
        { value: "ForwardingFIN", Title: "Finance (Forwarding Users List)" },
        { value: "ForwardingCC", Title: "Cost Center (Forwarding Users List)" },
        { value: "ForwardingMP", Title: "Material Planner (Forwarding Users List)" },
        { value: "ForwardingWH", Title: "Warehouse (Forwarding Users List)" },
        { value: "ForwardingInvMgr", Title: "Inventory Manager (Forwarding Users List)" },
        { value: "ForwardingSCMHead", Title: "SCM Head (Forwarding Users List)" },
        { value: "ForwardingINV", Title: "Inventory (Forwarding Users List)" },
        { value: "ForwardingWHH", Title: "Warehouse Head (Forwarding Users List)" },
        { value: "ForwardingPPMCH", Title: "PPMC Head (Forwarding Users List)" },
        { value: "ForwardingGRN", Title: "GRN (Forwarding Users List)" }
    ];

    const options = dropdownOptions.map(option => ({
        value: option.value,
        label: option.Title
    }));

    const handleChange = (selectedOption) => {
        setDropdownValue(selectedOption); // selectedOption is an object { value, label }
        handleDropdownChange({
            target: { name: 'roleType', value: selectedOption?.value || '' }
        });
        formikRef.current.setFieldValue('roleType', selectedOption?.value || '');
    };

    const DepartmentDropdown = ["MaterialPlanner", "Warehouse", "SCMHead", "Finance", "Inventory", "WHH", "PPMCH", "GRN","InventoryManager"];
    const GetIASData = async () => {
        setLoading(true);
        try {
            const spCrudOps = await SPCRUDOPS();
            const Parameterdata = await spCrudOps.getData('Parameters', 'Id,Title,Details', '', '', { column: 'ID', isAscending: true }, props);
            setIASData(Parameterdata);
            return Parameterdata;
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        GetACL_UserData();
    }, []);

    const GetACL_UserData = async () => {
        setLoading(true);
        try {
            const spCrudOps = await SPCRUDOPS();
            const ACL_User = await spCrudOps.getData('IAS_ACL', 'ID,UserName/Title,UserName/ID,UserName/EMail,Title,Role', 'UserName', '', { column: 'ID', isAscending: true }, props);
            setACL_UserData(ACL_User);
            return ACL_User;
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const DeleteUser = async (item) => {
        const confirmed = window.confirm("This will remove the user name. To add again, use the (+) option.\n\nAre you sure you want to proceed?");

        if (!confirmed) return; // Exit if user cancels

        let ParameterData = [];

        if (IASData.length === 0) {
            ParameterData = await GetIASData();
        } else {
            ParameterData = IASData;
        }

        const match = ParameterData.find(item => item.Title === formikRef.current.values.roleType);
        let parseddatafilter = JSON.parse(match.Details).filter(test => test.email !== item.email);

        console.log(parseddatafilter);

        let spCrudObj = await USESPCRUD();
        let Fields = {
            Details: JSON.stringify(parseddatafilter)
        };

        await spCrudObj.updateData('Parameters', match.ID, Fields, props).then(async (_result) => {
            alert("Removed Successfully");
            handleDropdownChange({ target: { value: '' } });
        });
    };

    const handleDropdownChange = async (e) => {
        const selected = e.target.value;
        setDropdownValue(selected);
        setCurrentPage(1);

        const ParameterData: any[] = await GetIASData();

        if (selected === "Approvers") {
            const Department = ["MaterialPlanner", "Warehouse", "SCMHead", "Finance", "Inventory", "WHH", "PPMCH", "GRN","InventoryManager"];
            const ApproversData = Department.map((dept) => {
                const match = ParameterData.find(item => item.Title === dept);
                if (match) {
                    return {
                        user: JSON.parse(match.Details).user,
                        Title: match.Title
                    };
                }
                return null;
            }).filter(item => item !== null);

            setDetailsData(ApproversData);
        } else {
            const match = ParameterData.find(item => item.Title === selected);
            const parsedDetails = match ? JSON.parse(match.Details) : [];
            setDetailsData(parsedDetails);
        }
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleEditClick = () => {
        setPopupVisible(true);
    };

    const update = async () => {
        let ParameterData = [];

        if (IASData.length === 0) {
            ParameterData = await GetIASData();
        } else {
            ParameterData = IASData;
        }

        const { RoleType, Department, user } = formikRef.current.values;
        const User = parseInt(user, 10);

        // Collect validation errors
        const errors = [];

        if (!RoleType) {
            errors.push('Role Type');
        }

        if (RoleType === 'Approvers' && !Department) {
            errors.push('Department');
        }

        if (!User) {
            errors.push('User');
        }

        // Show alert if there are errors
        if (errors.length > 0) {
            alert(`Please select: ${errors.join(', ')}`);
            return;
        }

        const ACL_UserFilter = await ACL_UserData.filter(test => test.ID === User);

        let ParameterFilter;
        if (RoleType !== "Approvers") {
            ParameterFilter = ParameterData.filter(test => test.Title === RoleType);
        } else {
            ParameterFilter = ParameterData.filter(test => test.Title === Department);
        }
        let filteredParameter = JSON.parse(ParameterFilter[0].Details);
        if (filteredParameter.length > 0) {
            if (filteredParameter.filter(test => test.user === ACL_UserFilter[0].UserName.Title).length !== 0) {
                alert('User already exists');
                return false;
            }
        }
        else {
            if (filteredParameter.user === ACL_UserFilter[0].UserName.Title) {
                alert('User already exists');
                return false;
            }
        }

        if (ParameterFilter.length > 0) {
            console.log('ParameterFilter:', ParameterFilter);
            console.log('ACL_UserFilter:', ACL_UserFilter);
            let UpdatedUser;
            if (RoleType === 'Approvers') {
                UpdatedUser = {
                    user: ACL_UserFilter[0].UserName.Title,
                    email: ACL_UserFilter[0].UserName.EMail
                };
            }
            else {
                UpdatedUser = JSON.parse(ParameterFilter[0].Details);
                UpdatedUser.push({
                    user: ACL_UserFilter[0].UserName.Title,
                    email: ACL_UserFilter[0].UserName.EMail
                });
            }

            try {
                let spCrudObj = await USESPCRUD();
                let Fields = {
                    Details: JSON.stringify(UpdatedUser)
                };

                await spCrudObj.updateData('Parameters', ParameterFilter[0].ID, Fields, props);

                // Clear the form fields after successful update
                formikRef.current.setFieldValue('RoleType', '');
                formikRef.current.setFieldValue('Department', '');
                formikRef.current.setFieldValue('user', '');
                setDropdownValue('');
                handleDropdownChange({ target: { value: '' } });
                await closePopup();
                alert('User Added Successful.');
            } catch (error) {
                console.error('Error during updateData:', error);
                alert('Something went wrong while updating. Please try again.');
            }
        }
    };


    const closePopup = () => {
        setPopupVisible(false);
    };


    return (
        <Formik initialValues={initialvalue} innerRef={formikRef} onSubmit={() => {}}>
            {({ values }) => (
                <Form>
                    <div className="min-h-screen bg-gray-100">
                        <div className="header">
                            <div className="left-banner">
                                <div className="logo-text">
                                    <h2>Forwarding and Approvers Users List</h2>
                                </div>
                            </div>
                        </div>

                        <main className="p-6">
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '24px 16px' }}>
                                {/* Label and Dropdown */}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label
                                        htmlFor="roleType"
                                        style={{
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: '#4a4a4a',
                                            marginBottom: '6px'
                                        }}
                                    >
                                        Select Type
                                    </label>
                                    <Select
                                        id="roleType"
                                        name="roleType"
                                        value={dropdownValue}
                                        onChange={handleChange}
                                        options={options}
                                        placeholder="Search and select type..."
                                        isClearable
                                        styles={{
                                            container: (base) => ({
                                                ...base,
                                                width: '350px',
                                                fontSize: '14px'
                                            }),
                                            control: (base) => ({
                                                ...base,
                                                borderColor: '#ccc',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                            })
                                        }}
                                    />
                                </div>

                                {/* Add Button */}
                                <div>
                                    <button
                                        type="button"
                                        onClick={handleEditClick}
                                        title="Add"
                                        style={{
                                            color: 'green',
                                            fontSize: '24px',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            paddingBottom: '4px'
                                        }}
                                    >
                                        ➕
                                    </button>
                                </div>
                            </div>

                            {/* Table or No Data */}
                            {loading ? (
                                <p>Loading...</p>
                            ) : detailsData.length > 0 ? (
                                <div className="table-vert-scroll px-6 pt-4">
                                    <table className="min-w-full bg-white rounded-2xl shadow-md">
                                        <thead style={{ backgroundColor: "#ce0b0e" }} className="text-white">
                                            <tr>
                                                {values.roleType !== 'Approvers' && <th className="px-4 py-2">Action</th>}
                                                {values.roleType === 'Approvers' && <th className="px-4 py-2">Department</th>}
                                                <th className="px-4 py-2">Approver</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedData.map((item, index) => (
                                                <tr key={index} className="border-t">
                                                    {values.roleType !== 'Approvers' && <td className="px-4 py-2">
                                                        <button
                                                            onClick={() => DeleteUser(item)}
                                                            title="Remove"
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                fontSize: '20px',
                                                                cursor: 'pointer',
                                                                padding: 0
                                                            }}
                                                        >
                                                            ❌
                                                        </button>
                                                    </td>}
                                                    {values.roleType === 'Approvers' && <td className="px-4 py-2">{item.Title || ''}</td>}
                                                    <td className="px-4 py-2">{item.user}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 mt-8 pt-4">No data found</p>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center mt-6 overflow-x-auto">
                                    <div className="flex space-x-2 flex-nowrap px-4 py-2 bg-orange rounded shadow">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 border rounded"
                                            style={{ backgroundColor: "orange", color: "black", opacity: currentPage === 1 ? 0.5 : 1 }}
                                        >
                                            Previous
                                        </button>

                                        {currentPage > 3 && (
                                            <>
                                                <button
                                                    onClick={() => handlePageChange(1)}
                                                    className="px-3 py-1 border rounded"
                                                    style={{ backgroundColor: "orange", color: "black" }}
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
                                                    className="px-3 py-1 border rounded"
                                                    style={{
                                                        backgroundColor: currentPage === page ? "yellow" : "orange",
                                                        color: "black",
                                                        fontWeight: currentPage === page ? "bold" : "normal"
                                                    }}
                                                >
                                                    {page}
                                                </button>
                                            ))}

                                        {currentPage < totalPages - 2 && (
                                            <>
                                                <span className="px-2">...</span>
                                                <button
                                                    onClick={() => handlePageChange(totalPages)}
                                                    className="px-3 py-1 border rounded"
                                                    style={{ backgroundColor: "orange", color: "black" }}
                                                >
                                                    {totalPages}
                                                </button>
                                            </>
                                        )}

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 border rounded"
                                            style={{ backgroundColor: "orange", color: "black", opacity: currentPage === totalPages ? 0.5 : 1 }}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Popup Modal */}
                            {popupVisible && (
                                <>
                                    <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-hidden="false">
                                        <div className="modal-dialog modal-lg">
                                            <div className="modal-content">
                                                <div className="modal-body">
                                                    <table className="table table-bordered">
                                                        <colgroup>
                                                            <col style={{ width: '30%' }} />
                                                            <col style={{ width: '70%' }} />
                                                        </colgroup>
                                                        <tbody>
                                                            <tr>
                                                                <th>Select Role Type</th>
                                                                <td>
                                                                    <Field as="select" name="RoleType" className="form-control custom-dropdown">
                                                                        {dropdownOptions?.map((Vend) => (
                                                                            <option key={Vend.value} value={Vend.value}>
                                                                                {Vend.Title}
                                                                            </option>
                                                                        ))}
                                                                    </Field>
                                                                </td>
                                                            </tr>

                                                            {/* Show Department only if RoleType is 'Approvers' */}
                                                            {values.RoleType === 'Approvers' && (
                                                                <tr>
                                                                    <th>Department</th>
                                                                    <td>
                                                                        <Field as="select" name="Department" className="form-control custom-dropdown">
                                                                            <option value="">Select</option>
                                                                            {DepartmentDropdown?.map((Vend) => (
                                                                                <option key={Vend} value={Vend}>
                                                                                    {Vend}
                                                                                </option>
                                                                            ))}
                                                                        </Field>
                                                                    </td>
                                                                </tr>
                                                            )}

                                                            <tr>
                                                                <th>User</th>
                                                                <td>
                                                                    <FormikReactSelect name="user" options={ACL_UserData} />
                                                                </td>
                                                            </tr>

                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="modal-footer">
                                                    <button type="button" className="btn btn-primary" onClick={update}>OK</button>
                                                    <button type="button" className="btn btn-secondary" onClick={closePopup}>Cancel</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-backdrop fade show" />
                                </>
                            )}
                        </main>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default PartwiseReport;