import * as React from 'react';
import { useState, useEffect } from 'react';
import { IMgMotorProdProps } from '../IMgMotorProdProps';
import { IROFormFields } from '../../service/INTERFACE/IROFormFields';
import { CustomModal } from './CustomModal';
import './CSS/ReleaseOrder.scss';
import { SPComponentLoader } from '@microsoft/sp-loader';
// Load Bootstrap + FontAwesome
SPComponentLoader.loadCss('https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css');
SPComponentLoader.loadCss('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');

export const ReleaseOrder: React.FunctionComponent<IMgMotorProdProps> = (_props: IMgMotorProdProps) => {
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

  return (
    <>
      <div className="mg-container">
        <div className="mg-row mg-main-title">
          <div className="mg-col-3"><img src="/Style Library/Custom/images/MGLogo152x54.jpg" width="154px" /></div>
          <div className="mg-col-9">
            <span className='mg-row-header'>
              Release Order
            </span>
          </div>
        </div>
        <div className="mg-row mg-btn-row" style={{background: 'black', border: '2px solid red'}}>
          <div className="mg-col-9" id="btnBar">
            <a style={{ cursor: 'pointer', display: 'inline-block' }} className="mg-btn mg-btn-default" onClick={ClosePage}>
              Back
            </a>
            <a style={{ cursor: 'pointer', display: 'inline-block' }} className="mg-btn mg-btn-default" onClick={CreateDraft}>
              Create Draft
            </a>
            <a style={{ cursor: 'pointer', display: 'inline-block' }} className="mg-btn mg-btn-default mg-btn-NonDraft" onClick={SubmitRequest}>
              Submit
            </a>
            <a style={{ cursor: 'pointer', display: 'inline-block' }} className="mg-btn mg-btn-default mg-btn-NonDraft" onClick={ReadApprovalFlow_External}>
              Get Approval Flow
            </a>
            <a style={{ cursor: 'pointer', display: 'inline-block' }} className="mg-btn mg-btn-default mg-btn-NonDraft" onClick={() => SetCommentsFor(1, 'Withdrawn')}>
              Withdrawn
            </a>
            <a style={{ cursor: 'pointer', display: 'inline-block' }} className="mg-btn mg-btn-default mg-btn-NonDraft" onClick={Approved}>
              Approved
            </a>
            <a style={{ cursor: 'pointer', display: 'inline-block' }} className="mg-btn mg-btn-default mg-btn-NonDraft" onClick={() => SetCommentsFor(2, 'Rework')}>
              Rework
            </a>
            <a style={{ cursor: 'pointer', display: 'inline-block' }} className="mg-btn mg-btn-default mg-btn-NonDraft" onClick={() => SetCommentsFor(3, 'Reject')}>
              Reject
            </a>
            <a style={{ cursor: 'pointer', display: 'inline-block' }} className="mg-btn mg-btn-default mg-btn-NonDraft" onClick={() => SetCommentsFor(4, 'Remarks')}>
              Remarks
            </a>
            <a style={{ cursor: 'pointer', display: 'inline-block' }} className="mg-btn mg-btn-default mg-btn-EditPurpose" onClick={() => SetCommentsFor(5, 'Purpose')}>
              Edit Purpose
            </a>
          </div>
          <div className="mg-col-3" style={{ marginTop: '10px', textAlign: 'right', paddingRight: '15px' }}>
            <span className="statusLbl" style={{ color: 'white'}}>Status: <span id="Status">{fields.Status}</span></span><br />
          </div>
        </div>
        <div className="mg-row">
          <div className="workFlowBar">
            <span id="GUI_WorkFlow"></span>
          </div>
        </div>
        <div className="mg-row mg-row-marginTop10" id="BodyContainer">
          <table className="mg-table">
            <colgroup>
              <col style={{ width: '75%' }} />
              <col style={{ width: '25%' }} />
            </colgroup>
            <tr>
              <th style={{ textAlign: 'right', paddingRight: '10px' }}>
                Request No</th>
              <td><input type="text" value={fields.ReqNo} readOnly className="txtFullWidth" /></td>
            </tr>
            <tr>
              <th style={{ textAlign: 'right', paddingRight: '10px' }}>
                Request Date</th>
              <td><input type="text" value={fields.reqDate} readOnly /></td>
            </tr>
          </table>
          <table className="mg-table mg-table-bordered">
            <colgroup>
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <tr>
              <th colSpan={5} id="Section_Initiator">
                <a style={{ cursor: 'pointer', fontSize: '16px' }} onClick={setInitiatorData}>
                  Initiator Details <span className="glyphicon glyphicon-pencil"></span></a>
              </th>
            </tr>
            <tr>
              <th>Initiator Name</th>
              <th>Department</th>
              <th>Company</th>
              <th>Plant</th>
              <th>RO From</th>
            </tr>
            <tr>
              <td><input type="text" value={fields.InitiatorName?.Title} readOnly className="mg-txtFullWidth mg-form-control" /></td>
              <td><input type="text" value={fields.Department} readOnly className="mg-txtFullWidth mg-form-control" /></td>
              <td><input type="text" value={fields.Company} readOnly className="mg-txtFullWidth mg-form-control" /></td>
              <td><input type="text" value={fields.Plant} readOnly className="mg-txtFullWidth mg-form-control" /></td>
              <td><input type="text" value={fields.ROFrom} readOnly className="mg-txtFullWidth mg-form-control" /></td>
            </tr>
          </table>
          <table className="mg-table mg-table-bordered">
            <colgroup>
              <col style={{ width: '100%' }} />
            </colgroup>
            <tr>
              <th id="Section_PO">
                <a style={{ cursor: 'pointer', fontSize: '16px' }} onClick={setPOData}>
                  PO Details <span className="glyphicon glyphicon-search"></span></a>
              </th>
            </tr>
            <tr>
              <td>
                <table className="mg-table mg-table-bordered">
                  <colgroup>
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '15%' }} />
                  </colgroup>
                  <tr>
                    <th>PO Number</th>
                    <td><input type="text" value={fields.PONumber} readOnly /></td>
                    <th>Vendor Name</th>
                    <td><input type="text" value={fields.VendorName} readOnly /></td>
                    <th>Vendor Code</th>
                    <td><input type="text" value={fields.VendorCode} readOnly /></td>
                    <th>Cost Center</th>
                    <td><input type="text" value={fields.CostCenter} readOnly /></td>
                  </tr>
                  <tr>
                    <th>Start Date</th>
                    <td><input type="text" value={fields.POStartDate} readOnly /></td>
                    <th>End Date</th>
                    <td><input type="text" value={fields.POEndDate} readOnly /></td>
                    <th>PO Amount</th>
                    <td><input type="text" value={fields.POAmount} readOnly /></td>
                    <th>PO Balance</th>
                    <td><input type="text" value={fields.POBalanceAmount} readOnly /></td>
                  </tr>
                  <tr>
                    <th>Ref PR Number</th>
                    <td><input type="text" value={fields.RefPRNo} readOnly /></td>
                    <th>Budget Line Item</th>
                    <td colSpan={5}><input type="text" value={fields.BudgetLineItem} readOnly className="txtFullWidth" /></td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table className="mg-table mg-table-bordered">
            <colgroup>
              <col style={{ width: '100%' }} />
            </colgroup>
            <tr>
              <th id="Section_RO">
                <a style={{ cursor: 'pointer', fontSize: '16px' }} onClick={setData}>
                  RO Details <span className="glyphicon glyphicon-pencil"></span></a>
              </th>
            </tr>
            <tr>
              <th>
                Contractor to provide labour, equipment and material
                to perform work as follows, which is within the
                scope of purchase order/bid package
              </th>
            </tr>
            <tr>
              <td><textarea className="mg-form-control" value={fields.ContractorScopeDescription} rows={5} readOnly></textarea></td>
            </tr>
            <tr>
              <th>The Contractor agrees to execute completely the
                order by date :</th>
            </tr>
            <tr>
              <td><input type="text" className="mg-form-control" value={fields.ROEndDate} readOnly /></td>
            </tr>
            <tr>
              <th>The Contractor will be held responsible to do all
                work of his trade required for the full completion of
                the work described, including all work incidental
                thereto, or necessary to properly complete the work even
                though not specifically mentioned.</th>
            </tr>
            <tr>
              <th>RO Amount</th>
            </tr>
            <tr>
              <td><input className="mg-form-control" type="text" value={fields.ROAmount} readOnly /></td>
            </tr>
            <tr>
              <th>Purpose for this RO</th>
            </tr>
            <tr>
              <td><textarea className="mg-form-control" value={fields.Purpose} rows={5} readOnly></textarea></td>
            </tr>
            <tr>
              <th id="attHolder1">
                <div className="mg-form-control" id="attachFilesHolder1">
                  <label htmlFor="GeneralAttachmentFile" style={{ marginLeft: '20px' }}>
                    <span className="mg-btn mg-btn-primary"><span className="glyphicon glyphicon-plus-sign"></span>
                    Attachments</span>
                  </label>
                  <input id="GeneralAttachmentFile" className="mg-form-control" type="file" style={{ display: 'none' }} onChange={handleFileChange} />
                </div>
              </th>
            </tr>
            <tr>
              <td>
                <div>
                  <img src="https://mgmotor.sharepoint.com/Style Library/Custom/images/wait-circle.gif" alt="waitMsg" id="GeneralimgWaitFileUpload" style={{ display: 'none' }} />
                </div>
                <div id="GeneralAttachmentFileList"></div>
                <div id="GeneralUploadedFileList">
                  {/* List uploaded files */}
                </div>
              </td>
            </tr>
          </table>
          <table id="eSummaryDataTable" className="mg-table mg-table-bordered">
            <colgroup>
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '39%' }} />
            </colgroup>
            <thead>
              <tr>
                <th colSpan={5}><span className="mg-row-header">
                  Summary</span></th>
              </tr>
              <tr>
                <th>Initiator/Approver</th>
                <th>Forwarded To</th>
                <th>Action Date</th>
                <th>Action</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {/* Summary data */}
            </tbody>
          </table>
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
        <CustomModal show={showPO} onHide={() => setShowPO(false)} title="PO Details">
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
    </>
  );
};