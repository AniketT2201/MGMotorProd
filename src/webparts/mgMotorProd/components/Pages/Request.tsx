import * as React from 'react';
import { useState, useEffect } from 'react';
import { IMgMotorProdProps } from '../IMgMotorProdProps';
import { IROFormFields } from '../../service/INTERFACE/IROFormFields';
import { CustomModal } from './CustomModal';
import './CSS/ReleaseOrder.scss';
import { SPComponentLoader } from '@microsoft/sp-loader';
import { IUtilities } from '../../service/BAL/SPCRUD/utilities';
import SPCRUDOPS from "../../service/DAL/spcrudops";
import USESPCRUD, { ISPCRUD } from '../../service/BAL/SPCRUD/spcrud';
import { IPersonaProps } from 'office-ui-fabric-react';

//Date
import { DatePicker } from '@fluentui/react/lib/DatePicker';
import { DayOfWeek } from '@fluentui/react';
//PlantCodeMaster
import { IRO } from '../../service/INTERFACE/IRO';
import IASRequestsOps from '../../service/BAL/SPCRUD/RO';
//Date
import { format } from 'date-fns';
import { ISPCRUDOPS } from '../../service/DAL/spcrudops';
import '../Pages/CSS/NewRequest.scss';
import '../Ias.scss';
// import '../Pages/CSS/ReleaseOrder.scss';
// import '../Pages/CSS/Sidebar.scss';
//Template
import renderTemplateTable from '../../service/BAL/SPCRUD/Template'
//Excel
import * as XLSX from "xlsx";
import TableToExcel from '@linways/table-to-excel';
import { useHistory } from 'react-router-dom';
import * as yup from 'yup';
import { IDropdownOption } from '@fluentui/react/lib/Dropdown';
import IEmployeeProfileops from '../../service/BAL/SPCRUD/EmployeeProfile';
import IDelegateApproverops from '../../service/BAL/SPCRUD/DelegateApprover';
import { PrimaryButton } from '@fluentui/react/lib/Button';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faTrash } from "@fortawesome/free-solid-svg-icons";
import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";
import { Field } from 'formik';
// Load Bootstrap + FontAwesome
SPComponentLoader.loadCss('https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css');
SPComponentLoader.loadCss('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');

interface ExcelRecord {
  [key: string]: string;
}

type WorkflowStep = {
  type: string;
  user: string;
  email: string;
  required: boolean;
  EmpID: string;
};

export const Request: React.FunctionComponent<IMgMotorProdProps> = (_props: IMgMotorProdProps) => {
  // Form state
  const [fields, setFields] = useState<IROFormFields>({
    ReqNo: '',
    reqDate: '',
    InitiatorName: '',
    Department: '',
    Company: '',
    Plant: '',
    ROFrom: '',

    PONumber: '',
    VendorName: '',
    VendorCode: '',
    CostCenter: '',
    POStartDate: '',
    POEndDate: '',
    POAmount: '',
    POBalanceAmount: '',
    RefPRNo: '',
    BudgetLineItem: '',

    ContractorScopeDescription: '',
    ROEndDate: '',
    ROAmount: '',
    Purpose: '',
    Status: ''
  });

  // Update field function
  const updateField = (field: keyof IROFormFields, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  // Common remarks
  const [commonRemarks, setCommonRemarks] = useState('');

  type ROButton =
  | 'BACK'
  | 'CREATE_DRAFT'
  | 'SUBMIT'
  | 'GET_APPROVAL_FLOW'
  | 'WITHDRAW'
  | 'APPROVE'
  | 'REWORK'
  | 'REJECT'
  | 'REMARKS'
  | 'EDIT_PURPOSE';
  const [visibleButtons, setVisibleButtons] = useState<ROButton[]>([]);//Handle Button Visibility        
  const [BindingWorkflow, setWorkflow] = useState<WorkflowStep[]>([]);
  const [workflowJSX, setWorkflowJSX] = useState(null);
  const [ApprovalNoteNo, setApprovalNoteNo] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [Buttondisable, setButtondisable] = useState(true);

  // Modal states
  const [showInitiator, setShowInitiator] = useState(false);
  const [showPO, setShowPO] = useState(false);
  const [showRO, setShowRO] = useState(false);
  const [showRemarks, setShowRemarks] = useState(false);

  // Modal specific states
  const [mCompany, setMCompany] = useState('MGMOTOR');
  const [mPlant, setMPlant] = useState('HALOL');
  const [mROFrom, setMROFrom] = useState('Department');
  const [mContractorScopeDescription, setMContractorScopeDescription] = useState('');
  const [mROEndDate, setMROEndDate] = useState('');
  const [mROAmount, setMROAmount] = useState('');
  const [mPurpose, setMPurpose] = useState('');
  const [remarksTitle, setRemarksTitle] = useState('');
  const [remarksType, setRemarksType] = useState(0); // 1: Withdrawn, 2: Rework, etc.

  // Placeholder functions for logic - to be implemented later
  const ClosePage = () => { /* Logic */ };
  const CreateDraft = () => { /* Logic */ };
  const SubmitRequest = () => { /* Logic */ };
  const ReadApprovalFlow_External = () => { /* Logic */ };
  const Approved = () => { /* Logic */ };

  const SetCommentsFor = (type: number, title: string) => {
    setRemarksType(type);
    setRemarksTitle(title);
    setShowRemarks(true);
  };

  const setInitiatorData = () => {
    setShowInitiator(true);
    setMCompany(fields.Company);
    setMPlant(fields.Plant);
    setMROFrom(fields.ROFrom);
  };

  const UpdateInitiator = () => {
    updateField('Company', mCompany);
    updateField('Plant', mPlant);
    updateField('ROFrom', mROFrom);
    setShowInitiator(false);
    // Save logic
  };

  const setPOData = () => {
    // Fetch logic
    setShowPO(true);
  };

  const setData = () => {
    setMContractorScopeDescription(fields.ContractorScopeDescription);
    setMROEndDate(fields.ROEndDate);
    setMROAmount(fields.ROAmount);
    setMPurpose(fields.Purpose);
    setShowRO(true);
  };

  const UpdateRO = () => {
    updateField('ContractorScopeDescription', mContractorScopeDescription);
    updateField('ROEndDate', mROEndDate);
    updateField('ROAmount', mROAmount);
    updateField('Purpose', mPurpose);
    setShowRO(false);
    // Save logic
  };


  const ValidateRemarksIsNotBlank = () => {
    if (commonRemarks.trim() === '') return;
    // Process logic
    setShowRemarks(false);
    setCommonRemarks('');
  };

  // Files
  const [generalFiles, setGeneralFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setGeneralFiles(Array.from(e.target.files));
      // Upload logic
    }
  };

  useEffect(() => {
    // Init logic
  }, []);

  const handleAddAttachments = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true; // ✅ allow multiple files

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const newFiles = Array.from(target.files || []);

      // Avoid duplicates
      const filtered = newFiles.filter(
        newFile =>
          !attachments.some(
            existing => existing.name === newFile.name && existing.size === newFile.size
          )
      );

      setAttachments(prev => [...prev, ...filtered]);
    };

    input.click();
  };

  const handleDeleteAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // function resolveButtons( status: string, stage: number, isInitiator: boolean, isValidApprover: boolean) {
  //   const buttons: ROButton[] = ['BACK'];

  //   // Draft / Rework (Initiator)
  //   if ((status === 'Draft' || status === 'Rework') && isInitiator) {
  //     buttons.push('CREATE_DRAFT', 'SUBMIT', 'GET_APPROVAL_FLOW');
  //   }

  //   // Pending Approval – Initiator
  //   if (status === 'Pending Approval' && isInitiator) {
  //     buttons.push('WITHDRAW');
  //   }

  //   // Pending Approval – Approver
  //   if (status === 'Pending Approval' && isValidApprover) {
  //     buttons.push('APPROVE', 'REWORK', 'REJECT', 'REMARKS');

  //     // CR-73
  //     if (stage === 1) {
  //       buttons.push('EDIT_PURPOSE');
  //     }
  //   }

  //   setVisibleButtons(buttons);
  // }

  return (
    <form onKeyDown={(e) => {
        const target = e.target as HTMLElement;
        if (e.key === 'Enter' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      }}>
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
        <div className="container p-0" >
          <div className="header">
            <div className="left-banner">
              {/* <img src={`${props.currentSPContext.pageContext.web.absoluteUrl}/SiteAssets/Custom/imgs/MG-Motor-Logo.png`} alt="" className="hexagon" /> */}
              <div className="logo-text">
                <h2>Request Form</h2>
              </div>
            </div>
            {/* Add other header elements here if needed */}
          </div>
          <div id="mainContainer">
            <div id="tablemain">
              <table className="table table-bordered">
                <colgroup>
                  {[...Array(12)].map((_, i) => (
                    <col key={i} style={{ width: '8.33%' }} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="wf-tr p-0">
                    <td colSpan={12} className="wf-padding p-0">
                      <div className="displayWF">{workflowJSX}</div>
                      <div className="displayWFdelegated hidden"></div>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={12} className="bg-darkgray p-0">
                      <div className="button-bar">
                        {Buttondisable && (
                          <>
                            {/* BACK */}
                            {/* {visibleButtons.includes('BACK') && ( */}
                              <button
                                type="button"
                                className="btn btn-warning btn-approver btn-forward"
                                //onClick={ClosePage}
                              >
                                <i className="fa fa-forward"></i> Back
                              </button>
                            {/* )} */}

                            {/* CREATE DRAFT */}
                            {/* {visibleButtons.includes('CREATE_DRAFT') && ( */}
                              <button
                                type="button"
                                className="btn btn-warning btn-init"
                                //onClick={CreateDraft}
                              >
                                <i className="fa fa-mail-forward"></i> Create Draft
                              </button>
                            {/* )} */}

                            {/* SUBMIT */}
                            {/* {visibleButtons.includes('SUBMIT') && ( */}
                              <button
                                type="button"
                                className="btn btn-warning btn-init"
                                //onClick={SubmitRequest}
                              >
                                <i className="fa fa-mail-forward"></i> Submit
                              </button>
                            {/* )} */}

                            {/* GET APPROVAL FLOW */}
                            {/* {visibleButtons.includes('GET_APPROVAL_FLOW') && ( */}
                              <button
                                type="button"
                                className="btn btn-warning btn-approver"
                                //onClick={ReadApprovalFlow_External}
                              >
                                <i className="fa fa-check"></i> Get Approval Flow
                              </button>
                            {/* )} */}

                            {/* WITHDRAW */}
                            {/* {visibleButtons.includes('WITHDRAW') && ( */}
                              <button
                                type="button"
                                className="btn btn-warning btn-withdrawn"
                                //onClick={() => SetCommentsFor(1, 'Withdrawn')}
                              >
                                <i className="fa fa-times"></i> Withdrawn
                              </button>
                            {/* )} */}

                            {/* APPROVE */}
                            {/* {visibleButtons.includes('APPROVE') && ( */}
                              <button
                                type="button"
                                className="btn btn-warning btn-approver"
                                //onClick={Approved}
                              >
                                <i className="fa fa-check"></i> Approved
                              </button>
                            {/* )} */}

                            {/* REWORK */}
                            {/* {visibleButtons.includes('REWORK') && ( */}
                              <button
                                type="button"
                                className="btn btn-warning btn-approver"
                                //onClick={() => SetCommentsFor(2, 'Rework')}
                              >
                                <i className="fa fa-undo"></i> Rework
                              </button>
                            {/* )} */}

                            {/* REJECT */}
                            {/* {visibleButtons.includes('REJECT') && ( */}
                              <button
                                type="button"
                                className="btn btn-warning btn-approver"
                                //onClick={() => SetCommentsFor(3, 'Reject')}
                              >
                                <i className="fa fa-times"></i> Reject
                              </button>
                            {/* )} */}

                            {/* REMARKS */}
                            {/* {visibleButtons.includes('REMARKS') && ( */}
                              <button
                                type="button"
                                className="btn btn-warning btn-approver"
                                //onClick={() => SetCommentsFor(4, 'Remarks')}
                              >
                                <i className="fa fa-comments"></i> Remarks
                              </button>
                            {/* )} */}

                            {/* EDIT PURPOSE (CR-73) */}
                            {/* {visibleButtons.includes('EDIT_PURPOSE') && ( */}
                              <button
                                type="button"
                                className="btn btn-warning"
                                //onClick={() => SetCommentsFor(5, 'Purpose')}
                              >
                                <i className="fa fa-edit"></i> Edit Purpose
                              </button>
                            {/* )} */}

                          </>
                        )}

                        <div className="requestStatus">
                          <span>Status: </span><span className="displayStatus"></span>
                        </div>
                      </div>
                    </td>
                  </tr>
                </thead>
                <tbody className='tbodylabel'>
                  <tr>
                    <td colSpan={3}>
                      <label>Request No</label>
                      <Field name="reqNo" readOnly className="form-control" />
                    </td>

                    <td colSpan={3}>
                      <label>Request Date</label>
                      <Field name="reqDate" readOnly className="form-control" />
                    </td>
                  </tr>
                  <tr>
                    <th colSpan={12} className="bg-light">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>Initiator Details</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-warning"
                          //onClick={setInitiatorData}
                        >
                          Edit
                        </button>
                      </div>
                    </th>
                  </tr>

                  <tr>
                    <td colSpan={3}>
                      <label>Initiator Name</label>
                      <Field name="initiatorName" readOnly className="form-control" />
                    </td>
                    <td colSpan={3}>
                      <label>Department</label>
                      <Field name="department" readOnly className="form-control" />
                    </td>
                    <td colSpan={3}>
                      <label>Company</label>
                      <Field name="company" readOnly className="form-control" />
                    </td>
                    <td colSpan={3}>
                      <label>Plant</label>
                      <Field name="plant" readOnly className="form-control" />
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={3}>
                      <label>RO From</label>
                      <Field name="roFrom" readOnly className="form-control" />
                    </td>
                  </tr>
                  <tr>
                    <th colSpan={12} className="bg-light">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>PO Details</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-warning"
                          //onClick={setPOData}
                        >
                          Edit
                        </button>
                      </div>
                    </th>
                  </tr>

                  <tr>
                    <td colSpan={3}><label>PO Number</label><Field name="poNo" readOnly className="form-control" /></td>
                    <td colSpan={3}><label>Vendor Name</label><Field name="vendorName" readOnly className="form-control" /></td>
                    <td colSpan={3}><label>Vendor Code</label><Field name="vendorCode" readOnly className="form-control" /></td>
                    <td colSpan={3}><label>Cost Center</label><Field name="costCenter" readOnly className="form-control" /></td>
                  </tr>

                  <tr>
                    <td colSpan={3}><label>Start Date</label><Field name="startDate" readOnly className="form-control" /></td>
                    <td colSpan={3}><label>End Date</label><Field name="endDate" readOnly className="form-control" /></td>
                    <td colSpan={3}><label>PO Amount</label><Field name="poAmount" readOnly className="form-control" /></td>
                    <td colSpan={3}><label>PO Balance</label><Field name="poBalance" readOnly className="form-control" /></td>
                  </tr>

                  <tr>
                    <td colSpan={3}><label>Ref PR Number</label><Field name="refPRNumber" readOnly className="form-control" /></td>
                    <td colSpan={9}><label>Budget Line Item</label><Field name="budgetLineItem" readOnly className="form-control" /></td>
                  </tr>

                  <tr>
                    <th colSpan={12} className="bg-light">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>RO Details</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-warning"
                          //onClick={setData}
                        >
                          Edit
                        </button>
                      </div>
                    </th>
                  </tr>

                  <tr>
                    <td colSpan={12}>
                      <label>Contractor to provide labour, equipment and material to perform work as follows, which is within the scope of purchase order/bid package</label>
                      <Field
                        as="textarea"
                        name="contractorScopeDescription"
                        rows={3}
                        readOnly
                        className="form-control auto-height-textarea"
                      />
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={4}>
                      <label>The Contractor agrees to execute completely the order by date :</label>
                      <Field name="contractorExecuteByDate" readOnly className="form-control" />
                    </td>
                  </tr>
                  <tr>
                    <th colSpan={12} className="bg-light">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>The Contractor will be held responsible to do all work of his trade required for the full completion of the work described, including all work incidental thereto, or necessary to properly complete the work even though not specifically mentioned.</span>
                      </div>
                    </th>
                  </tr>
                  <tr>
                    <td colSpan={4}>
                      <label>RO Amount</label>
                      <Field name="roAmount" readOnly className="form-control" />
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={12}>
                      <label>Purpose for this RO</label>
                      <Field
                        as="textarea"
                        name="purpose"
                        rows={3}
                        readOnly
                        className="form-control auto-height-textarea"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={12}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span className="h4 m-0">Attachments</span>
                        <button
                          className="btn btn-warning btn-attachment btn-init"
                          type="button"
                          onClick={handleAddAttachments}
                          title="Add Attachment"
                          aria-label="Add Attachment"
                        >
                          <FontAwesomeIcon icon={faUpload} />
                        </button>
                      </div>

                      <div className="attachment-list">
                        {attachments.map((file, index) => (
                          <div key={index} className="attachment-item d-flex align-items-center gap-2">
                            <span>{file.name}</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteAttachment(index)}
                            >
                              ❌
                            </button>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={12}>
                      <div className="texth5">Summary</div>
                      <table className="table table-bordered" id="summaryDataTable">
                        <colgroup>
                          <col style={{ width: '15%' }} />
                          <col style={{ width: '15%' }} />
                          <col style={{ width: '15%' }} />
                          <col style={{ width: '15%' }} />
                          <col style={{ width: '40%' }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th>Initiator/Approver</th>
                            <th>Forwarded To</th>
                            <th>Action Date</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody></tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {/* Initiator Modal */}
          <CustomModal show={showInitiator} onHide={() => setShowInitiator(false)} title="Initiator Details">
            <table className="mg-table mg-table-bordered">
              <colgroup>
                <col style={{ width: '30%' }} />
                <col style={{ width: '70%' }} />
              </colgroup>
              <tr>
                <th>Company</th>
                <td>
                  <select value={mCompany} onChange={(e) => setMCompany(e.target.value)}>
                    <option value="MGMOTOR">MGMOTOR</option>
                  </select>
                </td>
              </tr>
              <tr>
                <th>Plant</th>
                <td>
                  <select value={mPlant} onChange={(e) => setMPlant(e.target.value)}>
                    <option value="HALOL">HALOL</option>
                    <option value="GURGAON">GURGAON</option>
                  </select>
                </td>
              </tr>
              <tr>
                <th>RO From</th>
                <td>
                  <select value={mROFrom} onChange={(e) => setMROFrom(e.target.value)}>
                    <option value="Department">Department</option>
                    <option value="Common">Common</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td colSpan={2}>Note: &quot;RO From&quot; Option
                  <ul>
                    <li><b>Department:</b> Raise RO where PR
                      is only for individual department.</li>
                    <li><b>Common:</b> Raise RO where PR is
                      common irrespective of any department.</li>
                  </ul>
                </td>
              </tr>
            </table>
            <div>
              <button id="btnUpdateInitiator" type="button" className="mg-btn mg-btn-default" onClick={UpdateInitiator}>
                Update
              </button>
              <button type="button" className="mg-btn mg-btn-default" onClick={() => setShowInitiator(false)}>
                Close
              </button>
            </div>
          </CustomModal>
  
          {/* PO Modal */}
          <CustomModal show={showPO} onHide={() => setShowPO(false)} title="PO Details" >
            <table className="mg-table mg-table-bordered" id="PODateTable">
              <colgroup>
                <col style={{ width: '2%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '10%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th></th>
                  <th>PO Number</th>
                  <th>Vendor Name</th>
                  <th>Vendor Code</th>
                  <th>Cost Center</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>PO Amount</th>
                  <th>Balance Amount</th>
                  <th>Ref. PRNo</th>
                  <th>Budget Line Item</th>
                </tr>
              </thead>
              <tbody>
                {/* Populate PO data */}
              </tbody>
            </table>
            <div>
              <button type="button" className="mg-btn mg-btn-default" onClick={() => setShowPO(false)}>
                Close
              </button>
            </div>
          </CustomModal>
  
          {/* RO Modal */}
          <CustomModal show={showRO} onHide={() => setShowRO(false)} title="RO Details">
            <table className="mg-table mg-table-bordered">
              <colgroup>
                <col style={{ width: '100%' }} />
              </colgroup>
              <tr>
                <th><span className="mg-required">*</span>
                  Contractor to provide labour, equipment and
                  material to perform work as follows, which is
                  within the scope of purchase order/bid package
                </th>
              </tr>
              <tr>
                <td><textarea className='mg-form-control' value={mContractorScopeDescription} onChange={(e) => setMContractorScopeDescription(e.target.value)} rows={5}></textarea></td>
              </tr>
              <tr>
                <th><span className="mg-required">*</span>The
                  Contractor agrees to execute completely the
                  order by date :</th>
              </tr>
              <tr>
                <td><input type="date" className='mg-form-control'  value={mROEndDate} onChange={(e) => setMROEndDate(e.target.value)} /></td>
              </tr>
              <tr>
                <th><span className="mg-required">*</span>The
                  Contractor will be held responsible to do all
                  work of his trade required for the full
                  completion of the work described, including all
                  work incidental thereto, or necessary to
                  properly complete the work even though not
                  specifically mentioned.</th>
              </tr>
              <tr>
                <th><span className="mg-required">*</span>RO Amount</th>
              </tr>
              <tr>
                <td><input type="text" className='mg-form-control'  value={mROAmount} onChange={(e) => setMROAmount(e.target.value)} /></td>
              </tr>
              <tr>
                <th><span className="mg-required">*</span>Purpose for
                  this RO</th>
              </tr>
              <tr>
                <td><textarea value={mPurpose} className='mg-form-control'  onChange={(e) => setMPurpose(e.target.value)} rows={5}></textarea></td>
              </tr>
            </table>
            <div>
              <button id="btnUpdateRO" type="button" className="mg-btn mg-btn-default" onClick={UpdateRO}>
                Update
              </button>
              <button type="button" className="mg-btn mg-btn-default" onClick={() => setShowRO(false)}>
                Close
              </button>
            </div>
          </CustomModal>
  
          {/* Remarks Modal */}
          <CustomModal show={showRemarks} onHide={() => setShowRemarks(false)} title={remarksTitle}>
            <div className="mg-row mg-top-buffer">
              <div className="mg-col-12">
                <label htmlFor="mCommonRemarks">
                  <span className="mg-required">
                    *
                  </span>Remarks - <span>{remarksTitle}</span>
                </label>
                <textarea rows={10} className="mg-form-control" value={commonRemarks} onChange={(e) => setCommonRemarks(e.target.value)} maxLength={100}></textarea>
              </div>
            </div>
            <div>
              <button id="btnRemarks" type="button" className="mg-btn mg-btn-default" onClick={ValidateRemarksIsNotBlank}>
                Update
              </button>
              <button type="button" className="mg-btn mg-btn-default" onClick={() => setShowRemarks(false)}>
                Close
              </button>
            </div>
          </CustomModal>
        </div>
      </>)}
    </form>
  );
};