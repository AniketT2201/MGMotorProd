import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Formik, Form, Field, FormikProps, useFormikContext } from "formik";
import type { IMgMotorProdProps } from '../IMgMotorProdProps';
import { IUtilities } from '../../service/BAL/SPCRUD/utilities';
import SPCRUDOPS from "../../service/DAL/spcrudops";
import USESPCRUD, { ISPCRUD } from '../../service/BAL/SPCRUD/spcrud';
import { IPersonaProps, keyframes } from 'office-ui-fabric-react';
import { CustomModal } from './CustomModal';
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
import '../Pages/CSS/ReleaseOrder.scss';
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
import { IROFormFields } from '../../service/INTERFACE/IROFormFields';
import RORequestsOps from '../../service/BAL/SPCRUD/RO';
import RO from '../../service/BAL/SPCRUD/RO';
import ReleaseOrderRequestsOps from '../../service/BAL/SPCRUD/ReleaseOrder';
import { formatAmount, formatDate, parseAmount, sanitize, useDebounce } from '../../service/BAL/SPCRUD/Helper';

const MRI: IDropdownOption[] = [
  { key: 'Yes', text: 'Yes' },
  { key: 'No', text: 'No' },
];
interface ExternalApprovalTriggerProps {
  roAmountConfirmedRef: React.MutableRefObject<boolean>;
}

interface FormValues {
  ReqNo?: any;
  Created?: any;
  InitiatorName?: any;
  Department?: any;
  Company?: any;
  Plant?: any;
  ROFrom?: any;

  PONumber?: any;
  VendorName?: any;
  VendorCode?: any;
  CostCenter?: any;
  POStartDate?: any;
  POEndDate?: any;
  POAmount?: any;
  POBalanceAmount?: any;
  RefPRNo?: any;
  BudgetLineItem?: any;

  reqDepartment?: any;
  InitiatorEmployeeID?: any;

  ContractorScopeDescription?: any;
  ROEndDate?: any;
  ROAmount?: any;
  Purpose?: any;
  Status?: any;
}

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

interface IRow {
  key: number;
  partNumber: string;
  description: string;
  supplier: string;
  qty: number;
  value: number;
  amount: number;
  remarks: string;
}

export interface TableRef {
  getData: () => IRow[];
  resetData: () => void;
  setData: (data: IRow[]) => void;
}

export const NewRequest: React.FC<IMgMotorProdProps> = (props: IMgMotorProdProps) => {
  const formikRef = useRef<FormikProps<FormValues>>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnFilters, setColumnFilters] = useState({
    PONumber: '',
    VendorName: '',
    VendorCode: '',
    CostCenter: '',
    POStartDate: '',
    POEndDate: '',
    POAmount: '',
    POBalanceAmount: '',
    RefPRNo: '',
    BudgetLineItem: ''
  });
  const resetFilters = () => {
    setColumnFilters({
      PONumber: '',
      VendorName: '',
      VendorCode: '',
      CostCenter: '',
      POStartDate: '',
      POEndDate: '',
      POAmount: '',
      POBalanceAmount: '',
      RefPRNo: '',
      BudgetLineItem: ''
    });
    setSearchTerm("");
  };
  const initialvalue = {
    ReqNo: '',
    Created: '',
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

    reqDepartment: '',
    InitiatorEmployeeID: '',

    ContractorScopeDescription: '',
    ROEndDate: '',
    ROAmount: '',
    Purpose: '',
    Status: ''
  };


  let spCrudObj: ISPCRUD;
  const history = useHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [mROAmount, setMROAmount] = useState<number | null>(null);
  const [mPurpose, setMPurpose] = useState('');
  const [remarksTitle, setRemarksTitle] = useState('');
  const [remarksType, setRemarksType] = useState(0);
  const [commonRemarks, setCommonRemarks] = useState('');
  //MASTER LIST
  const [MovementDropdown, setMovementDropdown] = useState([]);//Movementflow list data
  const [CostCenterdata, setCostCenterdata] = useState([]);//Costcenter list data
  const [ParameterDetails, setParameterDetails] = useState([]);//Parameter Data
  const [EmployeeData, setEmployeeData] = useState([]); //Employee Department from Employee Profile
  //MAIN LIST
  const [ROData, setROData] = useState([]); 
  const [POList, setPOList] = useState<any[]>([]);
  const [ROAmtList, setROAmtList] = useState<any[]>([]);
  const [rid, setrid] = React.useState<any>();//itemid
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
  const [userWF, setuserWF] = useState<any[]>([]);
  const [ApprovalNoteNo, setApprovalNoteNo] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [Buttondisable, setButtondisable] = useState(true);
  const [Summary, setSummary] = useState<any[]>([]);
  const [missingdata, setmissingdata] = useState(false);
  const [TotalAmountUp, setTotalAmountUp] = React.useState<any>();
  const [pofilteredData, setPOFilteredData] = useState<any[]>([]);
  const [roAmountBlurCount, setRoAmountBlurCount] = useState(0);
  const [roIntentId, setRoIntentId] = useState<number | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState("");




  //Global Variables
  let Details = useRef("");
  let Stage = useRef(0);
  //let Summary = useRef("");
  const hasRun = React.useRef(false);
  const ApprovalFlow = useRef<string>('');
  const ExternalApprovalFlow = useRef<string>('');
  const HasExternalWorkflow = useRef(false);
  const lastHandledIntentRef = useRef<number | null>(null);
  const roAmountBlurredRef = useRef(false);
  const roAmountOnBlurRef = useRef<number | null>(null);
  const triggerKeyRef = useRef<string | null>(null);
  const NextApproverEmail = useRef<string>('');
  const NextApproverId = useRef<number | null>(null);
  const NextApproverEmployeeId = useRef<string>('');
  const DelegatedApprover = useRef<string>('');
  const DelegatedApproverId = useRef<number | null>(null);
  const ReqID = useRef<number | null>(null);
  let newworkflow = useRef<WorkflowStep[]>([]);
  let uploadedFileKey = useRef<string[]>([]);
  let updateInitiatordata = useRef<any[]>([]);
  let DelegateData = useRef([]);
  let SiteWiseApproval = useRef<any[]>([]);
  let Copyupdateworkflow = useRef<any[]>([]);
  const tableRef = useRef<TableRef>(null);
  let Counter = useRef<any[]>([]);

  //for Formik
  function getFieldProps(formik: FormikProps<any>, field: string) {
    return { ...formik.getFieldProps(field), errorMessage: formik.errors[field] as string };
  }

  //onload: ensure loader shows while initial data loads
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        await fetchData();

        const id = getParameterByName('ItemId');
        if (id) {
          await loadROById(Number(id));
        } else {
          //fetchInitiatorData();
        }

        const data = tableRef.current?.getData() || [];

        const totalAmount = data.reduce((sum, item) => sum + Number(item.amount || 0), 0);

        console.log("Total Amount:", totalAmount);
        setTotalAmountUp(totalAmount);

        // let updateworkflow = BindingWorkflow;
        // setWorkflow(updateworkflow);
        // displayWorkflow();
      } catch (err) {
        console.error('Initialization failed:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  
  //List Data of Site Wise Approval Level
  async function GetSiteWiseApproval() {
    const spCrudOps = await SPCRUDOPS();
    const SiteWiseApprovalData = await spCrudOps.getRootData(
      'SiteWiseApproval',
      'Title,Level',
      '',
      `Title eq 'RO'`,
      { column: 'ID', isAscending: true },
      props
    );
    console.log('SiteWiseApprovalData:', SiteWiseApprovalData);
    //setSiteWiseApproval(SiteWiseApproval);
    SiteWiseApproval.current = SiteWiseApprovalData;
  }

  async function GetUserDetails() {
    let item = await EmployeeProfile(props.userEmail);
    try {
      if (item.length > 0 && (SiteWiseApproval.current[0].Level != null && SiteWiseApproval.current[0].Level != undefined && SiteWiseApproval.current[0].Level != '')) {
        formikRef.current?.setFieldValue('InitiatorName', props.userDisplayName);
        const today = new Date();
        const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
        formikRef.current?.setFieldValue('Created', formattedDate);
        formikRef.current?.setFieldValue('Department', item[0].DepartmentCode.Department);
        formikRef.current?.setFieldValue('Company', item[0].Company);
        formikRef.current?.setFieldValue('Plant', item[0].OfficeCity.CompanyLocation);
        //formikRef.current?.setFieldValue('ROFrom', item[0].DepartmentCode.Department);

        //Copyupdateworkflow.current.push(JSON.parse('{"user":"' + item[0].FullName.Title + '","type":"initiator","required":true,"email":' + item[0].FullName.EMail +'}'))
        Copyupdateworkflow.current.push({
          user: item[0].FullName.Title,
          type: "initiator",
          required: true,
          email: item[0].FullName.EMail,
          EmpID: await GetEmployeeID(item[0].FullName.EMail)
        });
        var cntApprover = SiteWiseApproval.current[0].Level;
        if (cntApprover) {
          const buttons: ROButton[] = [];
          buttons.push('SUBMIT', 'GET_APPROVAL_FLOW');
        }
 
        let nextmanager;
        let test;
 
        for (let i = 1; i <= parseInt(cntApprover); i++) {          
          const department = item[0].DepartmentCode.Department
 
          // First iteration set up initial manager
          if (i === 1) {
            nextmanager = item[0].DirectManagerName.EMail;
            test = {
              user: item[0].DirectManagerName.Title,
              type: "Manager",
              required: true,
              email: item[0].DirectManagerName.EMail,
              EmpID: await GetEmployeeID(item[0].DirectManagerName.EMail)
            };
          }
 
          // Subsequent iterations → fetch next manager in chain
          else {
            const currentEmployeeData = await EmployeeProfile(nextmanager);
            const directManager = currentEmployeeData[0].DirectManagerName;
            const departmentMatch = currentEmployeeData[0].DepartmentCode.Department === department;
            const EmployID = currentEmployeeData[0].DirectManagerCode;
 
            nextmanager = directManager.EMail;
 
            if (!departmentMatch) {
              break;
            }
 
            test = {
              user: directManager.Title,
              type: `Manager${i}`,
              required: true,
              email: directManager.EMail,
              EmpID: EmployID
            };
          }
 
          // Push test only if it's defined
          if (test) {
            Copyupdateworkflow.current.push(test);
          }
        }
        setWorkflow(Copyupdateworkflow.current);
        //await GetExternalApprover(item[0].DepartmentCode.Department, Copyupdateworkflow);
      }
      else {
        //$(".MainContainer").html("<h1 style='text-align:center'>Missing Master Data.<br>Please contact administrator!!</h1>");
        let wf = (
          <React.Fragment>
          <h1 style={{ textAlign: 'center', color: 'white' }}>
                        Missing Master Data Please Contact IT Team
          </h1>
          </React.Fragment>
        );

        setWorkflowJSX(wf);
      }
    }
    catch (error) {
      console.log(error);
      setmissingdata(true);
      let wf = (
          <React.Fragment>
          <h1 style={{ textAlign: 'center', color: 'white' }}>
                      Missing Master Data Please Contact IT Team
          </h1>
          </React.Fragment>
      );
 
      setWorkflowJSX(wf);
    }
  }

  const getNAandDAId = async () => {

    let DAId: number | null = null;
    let DelegateApproverEmpID: number | null = null;

    // 🔹 Current Approver (CA)
    const caUser = await getuserdata(BindingWorkflow[0].email);
    const caId = caUser?.data?.Id;

    // 🔹 Next Approver (NA) - call only once
    const naUser = await getuserdata(BindingWorkflow[1].email);
    const naId = naUser?.data?.Id;
    const naEmail = naUser?.data?.Email;

    const naEmployeeId = await GetEmployeeID(BindingWorkflow[1].email);

    // 🔹 Check Delegation
    // const delegateData = await IDelegateApproverops().getDelegateApprover(BindingWorkflow[1].email, props);

    let DelegateDataNAID = await IDelegateApproverops().getDelegateApprover(
          BindingWorkflow[1].email,
          props,
        );
        // let tda = DelegateDataNAID;
        let forwardingDataNAID =
          await IDelegateApproverops().getOffboardingApprover(BindingWorkflow[1].email, props);
        let tda;
    
        if (forwardingDataNAID.length > 0) {
          tda = forwardingDataNAID;
        } else {
          tda = DelegateDataNAID;
        }

    if (Array.isArray(tda) && tda.length > 0) {
      DelegateApproverEmpID = tda[0]?.DelegateToEmpID;
      DAId = tda[0]?.DelegateToId;
    }

    // 🔹 Assign Refs (IMPORTANT FIX)
    NextApproverEmail.current = naEmail;
    NextApproverId.current = naId;
    NextApproverEmployeeId.current = naEmployeeId;

    DelegatedApproverId.current = DAId;  // ✔ actual delegate Id
    DelegatedApprover.current = tda[0]?.DelegateTo?.EMail || null; // ✔ actual delegate email

  };


  const rewisePOBalanceAmount = async (reqNo: string) => {
    if (!reqNo) return;

    try {
      const spCrudObj = await SPCRUDOPS();
      // 1️⃣ Get active RO amount tracking entry for this RO
      const items = await spCrudObj.getData(
        'ROAmountTracking_List',
        'Id,Title,RONumber',
        '',
        `RONumber eq '${reqNo}' and Title eq 'Active'`,
        { column: 'ID', isAscending: true },
        props
      );

      if (!items || items.length === 0) return;

      // 2️⃣ Deactivate the first matching row
      await spCrudObj.updateData(
        'ROAmountTracking_List',
        items[0].Id,
        { Title: 'DeActive' },
        props
      );

    } catch (error) {
      console.error('Failed to rewise PO balance:', error);
      alert(
        'Failed to update PO balance. Refresh page and try again.\nIf problem persists, contact administrator.'
      );
    }
  };


  const generateReqNo = (id: number, department: string) => {
    let padded = '';

    if (id < 10) padded = '00000' + id;
    else if (id < 100) padded = '0000' + id;
    else if (id < 1000) padded = '000' + id;
    else if (id < 10000) padded = '00' + id;
    else if (id < 100000) padded = '0' + id;
    else padded = id.toString();

    const year = new Date().getFullYear();
    return `RO/${department}/${year}/${padded}`;
  };

  //--------------------------------------------------------------------------------------------//
  // Placeholder function for Creating External Workflow logic 
  //--------------------------------------------------------------------------------------------//
  // const ExternalApprovalTrigger = ({ roIntentId, lastHandledIntentRef, }: { roIntentId: number | null; lastHandledIntentRef: React.MutableRefObject<number | null>; }) => {
  //   const { values } = useFormikContext<any>();

  //   useEffect(() => {
  //     if (!roIntentId) return;

  //     // 🚫 already handled this blur
  //     if (lastHandledIntentRef.current === roIntentId) return;

  //     const roAmount = Number(values.ROAmount);
  //     const plant = values.Plant;
  //     const department = values.Department;

  //     // ✅ semantic validity
  //     if (!roAmount || !plant || !department) return;

  //     // ✅ consume intent BEFORE calling API
  //     lastHandledIntentRef.current = roIntentId;

  //     ReadApprovalFlow_External();

  //   }, [roIntentId, values.Plant, values.Department,]);

  //   return null;
  // };

  const getExternalApprovalWorkflow = async (amount: number, plant: string, department: string) => {
    const spCrudOps = await SPCRUDOPS();

    const data = await spCrudOps.getRootData(
      'ROWorkFlow',
      'ID,LowerLimit,UpperLimit,CompanyLocation/Id,CompanyLocation/CompanyLocation,Department/Id,Department/Title,UserName/Title,UserName/EMail,UserName/Id',
      'UserName,CompanyLocation,Department',
      `LowerLimit le ${amount} and UpperLimit ge ${amount} and CompanyLocation/CompanyLocation eq '${plant}' and Department/Title eq '${department}'`,
      { column: 'ID', isAscending: true },
      props
    );
    console.log('External Workflow Data:', data);
    return data;
  };

  const buildRawExternalFlow = (wfItems: any[]) => {
    return wfItems
      .map(
        u => `${u.Title}|${u.EMail}|FinMgr`
      )
      .join(';');
  };

  const buildExternalWorkflowSteps = async (wfItems: any[]): Promise<WorkflowStep[]> => {
    const steps: WorkflowStep[] = [];
    for (const u of wfItems) {
      const name = u.Title;
      const email = u.EMail;
      // For testing because finance manager email is not in usermaster
      const empId = await GetEmployeeID(email);

      //const empId = await GetEmployeeID(props.userEmail);

      if (!empId) {
        throw new Error(`Employee ID not found for ${email}`);
      }

      steps.push({
        user: name,
        type: "FinMgr",          // MC / FIN / WH etc.   
        required: true,
        email: email,
        EmpID: empId
      });
    }

    return steps;
  };
  
  const ReadApprovalFlow_External = async (mROAmount: any) => {
    try {
      const amount = parseAmount(mROAmount);
      const plant = formikRef.current?.values.Plant;
      const department = formikRef.current?.values.Department;

      if (!amount || !plant || !department) {
        alert("Missing RO Amount / Plant / Department");
        return;
      }

      setLoading(true);

      // 🔹 Get external workflow
      const results = await getExternalApprovalWorkflow(amount, plant, department);

      const hasExternalRule = results?.length > 0;
      HasExternalWorkflow.current = hasExternalRule;

      let externalSteps: WorkflowStep[] = [];
      let rawExternalFlow = "";

      if (hasExternalRule) {

        const wfItems = results.map((r: any) => r.UserName).filter(Boolean);

        // 🔹 Alert if rule exists but no approver
        if (wfItems.length === 0) {
          alert("No external approval workflow found.");
        } 
        else {
          rawExternalFlow = buildRawExternalFlow(wfItems);
          externalSteps = await buildExternalWorkflowSteps(wfItems);
        }
      } else {
        alert("No external approval workflow found.");
      }

      // 🔹 Decide final workflow
      if (externalSteps.length > 0) {
        newworkflow.current = [...BindingWorkflow, ...externalSteps];
      } 
      else {
        newworkflow.current = [...BindingWorkflow];
      }

      // 🔹 Update UI workflow
      setWorkflow(newworkflow.current);
      console.log("Final Workflow:", newworkflow.current);

      // 🔹 Save external flow reference
      ExternalApprovalFlow.current = rawExternalFlow;
    }
    catch (error: any) {
      console.error("ReadApprovalFlow_External failed:", error);
      alert(error.message || "Failed to load external approval workflow");
    }
    finally {
      setLoading(false);
    }
  };

  //--------------------------------------------------------------------------------------------//
  // End of Placeholder function for Creating External Workflow logic 
  //--------------------------------------------------------------------------------------------//

  //--------------------------------------------------------------------------------------------//
  // Placeholder function for CreateDraft logic 
  //--------------------------------------------------------------------------------------------//
  const CreateDraft = async () => {
    if (!(await validateBeforeSubmit())) {
      return;
    }
    try {
      const spCrudObj = await SPCRUDOPS();
      const UserId = (await getuserdata(props.userEmail)).data.Id; 
      if (!Copyupdateworkflow.current || Copyupdateworkflow.current.length === 0) {
        alert(
          'Unable to Create Draft\nYour workflow missing for RO application, Contact Administrator for further details.'
        );
        return;
      }

      setLoading(true);

      const values = formikRef.current?.values;

      // 🔹 PO snapshot (even if partially filled)
      const poSnapshot = {
        PONumber: values.PONumber || '',
        VendorName: values.VendorName || '',
        VendorCode: values.VendorCode || '',
        CostCenter: values.CostCenter || '',
        POStartDate: values.POStartDate || '',
        POEndDate: values.POEndDate || '',
        POAmount: values.POAmount || '',
        POBalanceAmount: values.POBalanceAmount || '',
        RefPRNo: values.RefPRNo || '',
        BudgetLineItem: values.BudgetLineItem || ''
      };

      // 🔹 Initial Summary entry
      const summaryEntry = {
        c1: props.userDisplayName,
        c2: '',
        c3: format(new Date(), 'dd-MM-yyyy HH:mm'),
        c4: 'Request Created',
        c5: '',
        c6: '',
      };

      // 🔹 CREATE LIST ITEM (Angular: addItem)
      const payload = {
        InitiatorNameId: UserId,
        InitiatorEmployeeID: props.EmployeeId?.[0]?.EmployeeID,
        NextApproverId: null,
        NextApproverEmpID: '',
        DelegationApproverId: null,
        DelegateApproverEmpID: '',
        Department: values.Department,
        Company: values.Company,
        Plant: values.Plant,
        ROFrom: values.ROFrom,
        ContractorScopeDescription: values.ContractorScopeDescription,
        ROEndDate: values.ROEndDate,
        ROAmount: values.ROAmount,
        Purpose: values.Purpose,
        ApprovalFlow: JSON.stringify(newworkflow.current),
        ApprovalFlow_External: ExternalApprovalFlow.current || '',
        Status: 'Draft',
        Stage: 0,
        PODetails: JSON.stringify([poSnapshot]),
        Summary: JSON.stringify([summaryEntry])
      };

      const addResult = await spCrudObj.insertData('ROList', payload, props);

      const itemId = addResult.data.ID;
      ReqID.current = itemId;

      // Step 2: Upload attachments first
      if (attachments.length > 0) {
        for (const file of attachments) {
          try {
            await spCrudObj.addAttchmentInList(file, 'ROList', ReqID.current, file.name, props);
            console.log(`Attachment ${file.name} uploaded.`);
          } catch (error) {
            console.error(`Failed to upload attachment ${file.name}:`, error);
            alert(`Failed to upload attachment ${file.name}`);
            setButtondisable(true);
            setLoading(false);
            return;
          }
        }
      }

      // 🔹 Generate ReqNo (Angular logic)
      const reqNo = generateReqNo(itemId, values.Department);

      // 🔹 UPDATE ITEM WITH ReqNo
      const update = await spCrudObj.updateData('ROList', itemId, { ReqNo: reqNo }, props);

      alert('Draft created successfully');

      // 🔹 Redirect
      history.push(`/`);

    } catch (error) {
      console.error('Create Draft failed:', error);
      alert('Error occurred while creating draft');
    } finally {
      setLoading(false);
    }
  };

  //--------------------------------------------------------------------------------------------//
  // End of Placeholder function for CreateDraft logic 
  //--------------------------------------------------------------------------------------------//
  const preparePOListWithBalance = ( poList: any[], roAmtList: any[], ROFrom: string, department: string ) => { 
    const edata: any[] = [];

  // 1️⃣ Filter POs based on ROFrom and add SelectPO
  if (ROFrom && ROFrom !== "") {
    // Department case
    poList.forEach((po) => {
      if (po.Department === department) {
        po.SelectPO = po.PONumber + po.CostCenter;
        edata.push(po);
      }
    });
  } else {
    // Common case
    poList.forEach((po) => {
      if (po.Department === "Common") {
        po.SelectPO = po.PONumber + po.CostCenter;
        edata.push(po);
      }
    });
  }

  // 2️⃣ Calculate POBalanceAmount for all POs
  poList.forEach((po) => {
    if (roAmtList && roAmtList.length > 0) {
      const deptPrefix = ROFrom && ROFrom !== "" ? `RO/${department}` : "RO/Common";

      // Sum of RO amounts for this PO and department
      const balance = roAmtList
        .filter((ro) => ro.PONumber === po.PONumber && ro.RONumber?.includes(deptPrefix))
        .reduce((sum, ro) => sum + Number(ro.Amount || 0), 0);

      po.POBalanceAmount = Number(po.POAmount) - balance;
    } else {
      po.POBalanceAmount = Number(po.POAmount);
    }
  });

  return edata; // only the filtered POs
};
  
  const calculateUsedAmount = ( poNumber: string, currentRONumber?: string) => { 
    return ROAmtList.reduce((sum, item) => { 
      const isSamePO = item.PONumber === poNumber; 
      const isSameRO = currentRONumber && item.RONumber === currentRONumber; 
      if (isSamePO && !isSameRO) { 
        sum += Number(item.Amount); 
      } 
      return sum; 
    }, 0); 
  };

  const appendSummary = (action: string, remarks: string, NextApprover : string, DelegateApprover: string) => {
    const entry = {
      c1: props.userDisplayName,
      c2: NextApprover,
      c3: format(new Date(), 'dd-MM-yyyy HH:mm'),
      c4: action,
      c5: remarks,
      c6: DelegateApprover
    };

    setSummary(prev => [...prev, entry]);
    return JSON.stringify([...Summary, entry]);
  };

  //--------------------------------------------------------------------------------------------//
  // Placeholder functions for Submit logic 
  //--------------------------------------------------------------------------------------------//
  const validateSubmitUI = (): string[] => {
    const errors: string[] = [];

    if (!Copyupdateworkflow.current || Copyupdateworkflow.current.length === 0)
      errors.push('Unable to Submit Request\nYour workflow missing for RO application, Contact Administrator for further details.');

    if (HasExternalWorkflow.current && !ExternalApprovalFlow.current)
      errors.push('Missing External Approval Flow');

    if (!formikRef.current?.values.ROFrom)
      errors.push('Missing Initiator Details');

    if (!formikRef.current?.values.PONumber)
      errors.push('Missing PO Details');

    if (!formikRef.current?.values.ContractorScopeDescription)
      errors.push('Missing RO Details');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const poEnd = new Date(formikRef.current?.values.POEndDate);
    poEnd.setHours(0, 0, 0, 0);

    if (today > poEnd)
      errors.push(`PO Expired on ${formikRef.current?.values.POEndDate}`);

    return errors;
  };

  const resolveNextApprover = async () => {
    const next = BindingWorkflow[1];

    const spUser = await getuserdata(next.email);

    let delegationUserId = null;
    let delegationEmpID = null;

    // const delegation = await IDelegateApproverops().getDelegateApprover(next.email, props);
     let DelegateDataNAID = await IDelegateApproverops().getDelegateApprover(
          next.email,
          props,
        );
        // let tda = DelegateDataNAID;
        let forwardingDataNAID =
          await IDelegateApproverops().getOffboardingApprover(next.email, props);
        let tda;
    
        if (forwardingDataNAID.length > 0) {
          tda = forwardingDataNAID;
        } else {
          tda = DelegateDataNAID;
        }

    if (tda?.length > 0) {
      delegationUserId = tda[0]?.DelegateToId;
      delegationEmpID = tda[0]?.DelegateToEmpID;
    } // else {
    //   alert(`No delegation found for ${next.user}`); 
    //   return;
    // }

    return {
      nextApproverId: spUser.data.Id,
      delegationUserId,
      delegationEmpID,
      DelegateAppName:tda[0]?.DelegateTo?.Title,
      NextAppName:next.user
    };
  };

  const updateROForSubmit = async (nextApprover) => {
    const next = BindingWorkflow[1];
    const spCrudObj = await SPCRUDOPS();
    const UserId = (await getuserdata(props.userEmail)).data.Id; 
    const summaryJSON = appendSummary('Submitted For Approval', '',nextApprover?.NextAppName ?? null,nextApprover?.DelegateAppName ?? null);
    
    const values = formikRef.current?.values;

    // 🔹 PO snapshot (even if partially filled)
    const poSnapshot = {
      PONumber: values.PONumber || '',
      VendorName: values.VendorName || '',
      VendorCode: values.VendorCode || '',
      CostCenter: values.CostCenter || '',
      POStartDate: values.POStartDate || '',
      POEndDate: values.POEndDate || '',
      POAmount: values.POAmount || '',
      POBalanceAmount: values.POBalanceAmount || '',
      RefPRNo: values.RefPRNo || '',
      BudgetLineItem: values.BudgetLineItem || ''
    };

    const payload = {
      InitiatorNameId: UserId || null,
      InitiatorEmployeeID: props.EmployeeId[0]?.EmployeeID || '',
      Department: values.Department,
      Company: values.Company,
      Plant: values.Plant,
      ROFrom: values.ROFrom,
      ContractorScopeDescription: values.ContractorScopeDescription,
      ROEndDate: values.ROEndDate,
      ROAmount: values.ROAmount,
      Purpose: values.Purpose,
      ApprovalFlow: JSON.stringify(newworkflow.current),
      ApprovalFlow_External: ExternalApprovalFlow.current || '',
      PODetails: JSON.stringify([poSnapshot]),
      NextApproverId: nextApprover.nextApproverId || null,
      NextApproverEmpID: next.EmpID || '',
      DelegationApproverId: nextApprover.delegationUserId || null,
      DelegateApproverEmpID: nextApprover.delegationEmpID || '',
      Status: 'Pending Approval',
      Stage: Stage.current + 1,
      EmailFlag: 1,
      Summary: summaryJSON
    };

    const addResult = await spCrudObj.insertData('ROList', payload, props);

    const itemId = addResult.data.ID;
    ReqID.current = itemId;

    // Step 2: Upload attachments first
    if (attachments.length > 0) {
      for (const file of attachments) {
        try {
          await spCrudObj.addAttchmentInList(file, 'ROList', ReqID.current, file.name, props);
          console.log(`Attachment ${file.name} uploaded.`);
        } catch (error) {
          console.error(`Failed to upload attachment ${file.name}:`, error);
          alert(`Failed to upload attachment ${file.name}`);
          setButtondisable(true);
          setLoading(false);
          return;
        }
      }
    }

    // 🔹 Generate ReqNo (Angular logic)
    const reqNo = generateReqNo(itemId, values.Department);

    // 🔹 UPDATE ITEM WITH ReqNo
    const update = await spCrudObj.updateData('ROList', itemId, { ReqNo: reqNo }, props);

    return (reqNo);
  };

  const upsertROAmountTracking = async (updateRO) => {
    const spCrudObj = await SPCRUDOPS();
    const reqNo = updateRO;
    const existing = await ReleaseOrderRequestsOps().getROAmountTracking({ column: 'ID', isAscending: true }, props,`Title eq 'Active' and RONumber eq '${reqNo}'`);
    if (existing.length > 0) {
      try {
        await spCrudObj.updateData('ROAmountTracking_List', existing[0].ID, { Amount: formikRef.current?.values.ROAmount }, props);
      } catch (err) {
        console.error('Error updating RO Amount:', err);
        alert('Error updating RO Amount!');
      }
      } else {
        try {
          await spCrudObj.insertData('ROAmountTracking_List',
            {
              Title: 'Active',
              PONumber: formikRef.current?.values.PONumber,
              RONumber: reqNo,
              Amount: formikRef.current?.values.ROAmount
            },
            props
          );
        } catch (err) {
          console.error('Error updating RO Amount:', err);
          alert('Error inserting RO Amount!');
        }
      }
  };

  const validateBeforeSubmit = async (): Promise<boolean> => {
    const poAmount = parseAmount(formikRef.current?.values.POAmount);
    const roAmount = parseAmount(formikRef.current?.values.ROAmount);
    const poNumber = formikRef.current?.values.PONumber;
    const Department = formikRef.current?.values.Department;

    if (!poNumber || !Department) {
      alert('Missing PO or Department');
      return false;
    }

    const roamtlist = await ReleaseOrderRequestsOps().getROAmountTracking({ column: 'ID', isAscending: true }, props,`Title eq 'Active' and PONumber eq '${poNumber}' and substringof('RO/${Department}', RONumber)`); 

    const usedAmount = roamtlist.reduce((sum, r) => sum + Number(r.Amount),0);

    if (usedAmount + roAmount > poAmount) {
      alert('Insufficient PO balance');
      return false;
    }
    return true;
  };

  const SubmitRequest = async () => {
    const spCrudObj = await USESPCRUD();
    const valid = await validateFormAndTable();
    if (!valid) {
      return;
    }
    const errors = validateSubmitUI();
    if (errors.length) {
      alert(errors.map(e => `• ${e}`).join('\n'));
      return;
    }

    if (!(await validateBeforeSubmit())) {
      return;
    }

    try {
      setLoading(true);
      const nextApprover = await resolveNextApprover();
      const updateRO = await updateROForSubmit(nextApprover);
      await upsertROAmountTracking(updateRO);
      alert(`Request submitted successfully with ReqNo: ${updateRO}`);

      history.push('/');
    } catch (e) {
      console.error(e);
      alert('Submit failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  //--------------------------------------------------------------------------------------------//
  // End of Placeholder functions for Submit logic 
  //--------------------------------------------------------------------------------------------//

  //--------------------------------------------------------------------------------------------//
  // Placeholder functions for Approved logic 
  //--------------------------------------------------------------------------------------------//
  const Approved = async () => {
    try {
      setLoading(true);
      const spCrudObj = await SPCRUDOPS();
      const stage = Stage.current;
      const wf = BindingWorkflow.filter(w => w.required); 
      const isLastApprover = stage === wf.length - 1;

      let payload: any = {
        Stage: stage + 1,
        EmailFlag: 1
      };

      let summaryText = '';
      let nextStep ;
      let tda;
      // 🔹 LAST APPROVER
      if (isLastApprover) {
        payload = {
          ...payload,
          Status: 'Approved',
          NextApproverId: null,
          NextApproverEmpID: '',
          DelegationApproverId: null,
          DelegateApproverEmpID: ''
        };

        summaryText = DelegatedApprover.current === props.userDisplayName
          ? 'Request Approved (by Delegator)'
          : 'Request Approved';
      }

      // 🔹 INTERMEDIATE APPROVER
      else {
        nextStep = wf[stage + 1];
        const spUser = await getuserdata(nextStep.email);

        // Next approver
        payload.NextApproverId = spUser.data.Id;
        payload.NextApproverEmpID = nextStep.EmpID;

        // Delegation check (Angular: isFoundDelegation)
        // const delegate = await IDelegateApproverops().getDelegateApprover(nextStep.email, props);

        let DelegateDataNAID = await IDelegateApproverops().getDelegateApprover(
          nextStep.email,
          props,
        );
        // let tda = DelegateDataNAID;
        let forwardingDataNAID =
          await IDelegateApproverops().getOffboardingApprover(nextStep.email, props);
        
    
        if (forwardingDataNAID.length > 0) {
          tda = forwardingDataNAID;
        } else {
          tda = DelegateDataNAID;
        }

        payload.DelegationApproverId = tda?.length > 0 ? tda[0]?.DelegateToId : null;
        payload.DelegateApproverEmpID = tda?.length > 0 ? tda[0]?.DelegateToEmpID : '';

        summaryText = DelegatedApprover.current === props.userDisplayName
          ? 'Send to Next Approver'
          : 'Send to Next Approver';
      }

      // 🔹 SUMMARY UPDATE
      payload.Summary = appendSummary(summaryText, '',nextStep?.user,tda[0]?.DelegateTo?.Title);

      // 🔹 UPDATE RO ITEM
      await spCrudObj.updateData('ROList', ReqID.current, payload, props);
      alert(`Approve action completed successfully for Request ${formikRef.current?.values.ReqNo}`);
      // 🔹 Redirect
      history.push('/');

    } catch (error) {
      console.error('Approve failed:', error);
      alert('Approve action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  //--------------------------------------------------------------------------------------------//
  // End of Placeholder functions for Approved logic 
  //--------------------------------------------------------------------------------------------//

  //--------------------------------------------------------------------------------------------//
  // Placeholder functions for Rework / Reject / Withdraw / Remark / Edit Purpose logic 
  //--------------------------------------------------------------------------------------------//
  type ROAction =| 'REWORK' | 'REJECT' | 'WITHDRAW' | 'REMARK' | 'EDIT_PURPOSE';

  const ACTION_CONFIG = {
    REWORK: {
      status: 'Rework',
      stage: 0,
      summaryText: 'Request Rework',
      requiresRemarks: true,
      updateSummary: true,
      setNextApproverToInitiator: true,
      setEmailFlag: false
    },
    REJECT: {
      status: 'Reject',
      stage: 99,
      summaryText: 'Request Rejected',
      requiresRemarks: true,
      updateSummary: true,
      setNextApproverToInitiator: false,
      setEmailFlag: true
    },
    WITHDRAW: {
      status: 'Withdrawn',
      stage: 100,
      summaryText: 'Withdrawn',
      requiresRemarks: true,
      updateSummary: true,
      setNextApproverToInitiator: false,
      setEmailFlag: false
    },
    REMARK: {
      status: null,
      stage: null,
      summaryText: 'Remark Added',
      requiresRemarks: true,
      updateSummary: true,
      setNextApproverToInitiator: false,
      setEmailFlag: false
    },
    EDIT_PURPOSE: {
      status: null,
      stage: null,
      summaryText: null,          
      requiresRemarks: false,     
      updateSummary: false,       
      setNextApproverToInitiator: false,
      setEmailFlag: false
    }
  } as const;

  const processROAction = async (action: ROAction, remarks: string, updatedPurpose?: string, NextApprover?: string, DelegateApprover?: string) => {
    try {
      const config = ACTION_CONFIG[action];
      if (!config) return;

      // Remarks validation ONLY when Angular requires it
      if (config.requiresRemarks && !remarks.trim()) {
        alert('Remarks cannot be blank');
        return;
      }

      setLoading(true);

      const payload: any = {};

      // ✅ Summary only when Angular does
      if (config.updateSummary && config.summaryText) {
        payload.Summary = appendSummary(
          config.summaryText,
          remarks,
          NextApprover,
          DelegateApprover
        );
      }

      // ✅ Status / Stage only when applicable
      if (config.status !== null) payload.Status = config.status;
      if (config.stage !== null) payload.Stage = config.stage;

      // ✅ Rework → NextApprover = Initiator
      if (config.setNextApproverToInitiator) {
        const initiator = BindingWorkflow[0];
        const user = await getuserdata(initiator.email);
        payload.NextApproverId = user.data.Id;
        payload.NextApproverEmpID = initiator.EmpID;
      } else if (action !== 'REMARK' && action !== 'EDIT_PURPOSE') {
        payload.NextApproverId = null;
        payload.NextApproverEmpID = '';
      }

      // ✅ Reject → EmailFlag
      if (config.setEmailFlag) {
        payload.EmailFlag = 1;
      }

      // ✅ Edit Purpose (silent update)
      if (action === 'EDIT_PURPOSE' && updatedPurpose) {
        payload.Purpose = updatedPurpose;
      }

      const spCrudObj = await SPCRUDOPS();

      await spCrudObj.updateData('ROList', ReqID.current, payload, props);

      // ✅ Reject → PO balance reset
      if (action === 'REJECT' || action === 'WITHDRAW') {
        await rewisePOBalanceAmount(formikRef.current?.values.ReqNo);
      }

      alert(`${action} action for ${formikRef.current?.values.ReqNo} completed successfully.`);

      // Angular redirect behavior
      if (action !== 'REMARK' && action !== 'EDIT_PURPOSE') {
        history.push('/');
      }

      // UI-only update for Edit Purpose
      if (action === 'EDIT_PURPOSE' && updatedPurpose) {
        formikRef.current?.setFieldValue('Purpose', updatedPurpose);
      }

    } catch (error) {
      console.error(`${action} failed:`, error);
      alert(`${action} failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  //--------------------------------------------------------------------------------------------//
  // End of Placeholder functions for Rework / Reject / Withdraw / Remark / Edit Purpose logic 
  //--------------------------------------------------------------------------------------------//

  const getParameterByName = (name: string): string | null => {
    const query = window.location.hash.split('?')[1] ?? '';
    const params = new URLSearchParams(query);
    return params.get(name);
  };


  //List Data of RO using Id
  const loadROById = async (id: number) => {
    try {
      setLoading(true);
      
      const roArr = await ReleaseOrderRequestsOps().getRODataById({ column: 'ID', isAscending: true }, props, `ID eq ${id}`);
      console.log('RO Data:', roArr);
      if (!roArr || roArr.length === 0) return;
      const ro = roArr[0];

      // PODetails parsing (jQuery equivalent)
      const parsedPO = ro.PODetails && typeof ro.PODetails === 'string' ? JSON.parse(ro.PODetails)[0] : {};
      const parsedSummary = ro.Summary && typeof ro.Summary === 'string' ? JSON.parse(ro.Summary) : [];
      sanitize(parsedSummary);
      setSummary(parsedSummary);
      // 👉 SINGLE place where Formik is populated
      formikRef.current?.setValues({
        ...initialvalue,
        ...sanitize(ro),
        ...sanitize(parsedPO)
      });

      // Non-UI workflow refs
      ReqID.current = ro.ID;
      Stage.current = ro.Stage;

    } catch (error) {
      console.error('Failed to load RO by ID:', error);
    } finally {
      setLoading(false);
    }
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

  // Get Employee ID with error handling
  async function GetEmployeeID(Email: string): Promise<string | null> {
    try {
      const spCrudOps = await SPCRUDOPS();

      const EmployeeProfiledata = await spCrudOps.getRootData(
        'UserMaster',
        'EmployeeId,Id,FullName/Title,FullName/ID,FullName/EMail,DirectManagerName/Title,DirectManagerName/ID,DirectManagerName/EMail,OfficeCity/CompanyLocation,OfficeCity/ID,DepartmentCode/Department,DepartmentCode/ID,Company',
        'FullName,DirectManagerName,OfficeCity,DepartmentCode',
        `FullName/EMail eq '${Email}' and EmployeeStatus eq 'Active'`,
        { column: 'ID', isAscending: true },
        props
      );

      if (!EmployeeProfiledata || EmployeeProfiledata.length === 0) {
        console.warn("Employee ID not found for email:", Email);
        return null;
      }

      if (EmployeeProfiledata.length > 1) {
        console.warn("Multiple active employees found with the same email:", Email);
        return null;
      }

      const empId = EmployeeProfiledata[0]?.EmployeeId;
      if (!empId) {
        console.warn("EmployeeId field missing for email:", Email);
        return null;
      }

      return empId;

    } catch (error) {
      console.error("Error fetching Employee ID for " + Email + ":", error);
      return null;
    }
  }

  //List Data of User Master
  async function EmployeeProfile(Email) {
    const spCrudOps = await SPCRUDOPS();
    const EmployeeProfiledata = await spCrudOps.getRootData(
      'UserMaster',
      'EmployeeId,Id,FullName/Title,FullName/ID,FullName/EMail,DirectManagerName/Title,DirectManagerName/ID,DirectManagerName/EMail,OfficeCity/CompanyLocation,OfficeCity/ID,DepartmentCode/Department,DepartmentCode/ID,Company,DirectManagerCode',
      'FullName,DirectManagerName,OfficeCity,DepartmentCode',
      `FullName/EMail eq '` + Email + `'`,
      { column: 'ID', isAscending: true },
      props
    );
    //setEmployeeData(EmployeeProfiledata);
    console.log('Employee Profile Data: ',EmployeeProfiledata);
    return EmployeeProfiledata;
  }

  //fetchdata
  const fetchData = async () => {
    try {
      let Initiatordata = await EmployeeProfile(props.userEmail);
      updateInitiatordata.current = Initiatordata;
      setEmployeeData(Initiatordata);
      if (Stage.current === 0) {
        const poList = await ReleaseOrderRequestsOps().getPOData({ column: 'ID', isAscending: true }, props,``);
        const roAmtList = await ReleaseOrderRequestsOps().getROAmountTracking({ column: 'ID', isAscending: true }, props,`Title eq 'Active'`);
        console.log('PO List:', poList);
        console.log('RO Amount List:', roAmtList);
        const department = Initiatordata[0]?.DepartmentCode?.Department;
        const roFrom = formikRef.current?.values.ROFrom;
        
        setPOList(poList);
        setROAmtList(roAmtList);
      }
      await GetSiteWiseApproval();
      await GetUserDetails();
      //await GetCostCenterdata();
      //showButtons([".btn-init"]);
      formikRef.current?.setFieldValue('requesterName', props.userDisplayName);
      if (Initiatordata.length > 0) {
        formikRef.current?.setFieldValue('reqDepartment', Initiatordata[0].DepartmentCode.Department);
      }
    } catch (error) {
      console.error("Failed to fetch ACL data:", error);
    }
  };

  const SetCommentsFor = (type: number, title: string) => {
    setRemarksType(type);
    setRemarksTitle(title);
    // 🔹 Load purpose into modal when Edit Purpose
    if (type === 5) {
      setCommonRemarks(formikRef.current?.values.Purpose || '');
    } else {
      setCommonRemarks(''); // normal remarks start empty
    }
    setShowRemarks(true);
  };

  //--------------------------------------------------------------------------------------------//
  // Placeholder Functions to save all three Initiator, PO, and RO fields
  //--------------------------------------------------------------------------------------------//  
  const saveROFields = async (payload: Record<string, any>) => {
    if (!ReqID.current) return;
    try {
      const spCrudObj = await SPCRUDOPS();
      await spCrudObj.updateData('ROList', ReqID.current, payload, props);
      alert('Data saved successfully');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save data. Please try again.');
    }
  };

  const setInitiatorData = () => {
    setMCompany(formikRef.current.values.Company);
    setMPlant(formikRef.current.values.Plant);
    setMROFrom(formikRef.current.values.ROFrom);
    setShowInitiator(true);
  };

  const UpdateInitiator = async () => {
    formikRef.current?.setValues({
      ...formikRef.current.values,
      Company: mCompany,
      Plant: mPlant,
      ROFrom: mROFrom
    });
    await saveROFields({
      Company: mCompany,
      Plant: mPlant,
      ROFrom: mROFrom
    });
    setShowInitiator(false);
  };

  const setPOData = () => {
    // Fetch logic
    setShowPO(true);
  };

  const UpdatePO = async (po: any) => {
    const poSnapshot = {
      PONumber: po.PONumber,
      VendorName: po.VendorName,
      VendorCode: po.VendorCode,
      CostCenter: po.CostCenter,
      POStartDate: formatDate(po.POStartDate),
      POEndDate: formatDate(po.POEndDate),
      POAmount: po.POAmount,
      POBalanceAmount: po.POBalanceAmount,
      RefPRNo: po.RefPRNo,
      BudgetLineItem: po.BudgetLineItem
    };

    // Update Formik
    formikRef.current?.setValues({
      ...formikRef.current.values,
      ...sanitize(poSnapshot)
    });
    // await saveROFields({PODetails: JSON.stringify([poSnapshot])});
    setShowPO(false);
  };

  const setDataRO = () => {
    setMContractorScopeDescription(formikRef.current.values.ContractorScopeDescription);
    setMROEndDate(formikRef.current.values.ROEndDate);
    setMROAmount(formikRef.current.values.ROAmount);
    setMPurpose(formikRef.current.values.Purpose);
    setShowRO(true);
  };

  const UpdateRO = async () => {
    formikRef.current?.setValues({
      ...formikRef.current.values,
      ROAmount: mROAmount
    });
    ReadApprovalFlow_External(mROAmount);
    setShowRO(false);
    // Save logic
  };

  //--------------------------------------------------------------------------------------------//
  // End of Placeholder Functions to save all three Initiator, PO, and RO fields
  //--------------------------------------------------------------------------------------------//  

  const ValidateRemarksIsNotBlank = () => {
    if (remarksType !== 5 && !commonRemarks.trim()) {
      alert("Remarks cannot be blank");
      return;
    }
    switch (remarksType) {
      case 1:
        processROAction('WITHDRAW', commonRemarks,'','','');
        break;
      case 2:
        processROAction('REWORK', commonRemarks,'','','');
        break;
      case 3:
        processROAction('REJECT', commonRemarks,'','','');
        break;
      case 4:
        processROAction('REMARK', commonRemarks,'','','');
        break;
      case 5:
        processROAction('EDIT_PURPOSE', '', commonRemarks,'','');
        break;
    }
    setCommonRemarks('');
    setShowRemarks(false);
  };

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

  const handleClose = () => {
    const lastActive = sessionStorage.getItem('sidebarFrom');
    if (lastActive) {
      history.push(lastActive);
    } else {
      history.push('/'); // Fallback route if none found
    }
  };


  function resolveButtons( status: string, stage: number, isInitiator: boolean, isValidApprover: boolean) {
    const buttons: ROButton[] = ['BACK'];

    // New Request – Initiator
    if ((status !== 'Draft' && status !== 'Rework' && status !== 'Pending Approval') && isInitiator) {
      buttons.push('CREATE_DRAFT', 'SUBMIT');
    }

    // Draft / Rework – Initiator
    else if ((status === 'Draft' || status === 'Rework') && isInitiator) {
      buttons.push('CREATE_DRAFT', 'SUBMIT');
    }

    // Pending Approval – Initiator (stage > 0)
    else if (status === 'Pending Approval' && isInitiator && stage > 0) {
      buttons.push('WITHDRAW');
    }

    // Pending Approval – Approver
    else if (status === 'Pending Approval' && isValidApprover  && !isInitiator) {
      buttons.push('APPROVE', 'REWORK', 'REJECT', 'REMARKS');

      if (stage === 1) {
        buttons.push('EDIT_PURPOSE'); // CR-73
      }
    }

    setVisibleButtons(buttons);
  }

  useEffect(() => {
    const initialize = async () => {

      if (BindingWorkflow.length > 0) {

        displayWorkflow();

        if (!formikRef.current) return;

        await getNAandDAId();

        const status = formikRef.current.values.Status;
        const stage = Stage.current;

        const isInitiator =
          formikRef.current.values.InitiatorName === props.userDisplayName;

        let isValidApprover = false;

        if (NextApproverEmail.current === props.userEmail) {
          isValidApprover = true;
        }

        if (!isValidApprover && DelegatedApprover.current === props.userEmail) {
          isValidApprover = true;
        }

        resolveButtons(status, stage, isInitiator, isValidApprover);
      }
    };

    initialize();

  }, [BindingWorkflow]);



  {/* Only count required items for arrow placement */ }
  const displayWorkflow = () => {
    let wf = [];

    BindingWorkflow.forEach((m, i) => {
      if (m.required === true) {
        const isActive = i === Stage.current ? 'activeApprover' : 'overrideStage';
        wf.push(
          <React.Fragment key={i}>
            <ul className="main-menu">
              <li className={`${m.type} ${isActive}`.trim()}>
                {m.user}
              </li>
            </ul>
          </React.Fragment>
        );
      }
    });

    setWorkflowJSX(wf);
  };

  //Filter Search based on each column 
  useEffect(() => {

  let filtered = [...POList];

  // 🔹 Department filter
  if (selectedDepartment) {
    filtered = filtered.filter(
      item => item.Department === selectedDepartment
    );
  }

  // 🔹 Active PO filter
  const today = new Date();
  today.setHours(0,0,0,0);

  filtered = filtered.filter((item) => {
    if (!item.POEndDate) return false;

    const endDate = new Date(item.POEndDate);
    endDate.setHours(0,0,0,0);

    return endDate >= today;
  });

  // 🔹 Column filters
  Object.keys(columnFilters).forEach((key) => {
    const value = columnFilters[key]?.toLowerCase();

    if (value) {
      filtered = filtered.filter((item) => {

        if (!item[key]) return false;

        if (key === "Created") {
          return formatDate(item[key])
            .toLowerCase()
            .includes(value);
        }

        return item[key]
          .toString()
          .toLowerCase()
          .includes(value);
      });
    }
  });

  // 🔹 Search filter
  if (searchTerm) {
    const lowerSearch = searchTerm.toLowerCase();

    filtered = filtered.filter(item =>
      item.PONumber?.toLowerCase().includes(lowerSearch) ||
      item.VendorName?.toLowerCase().includes(lowerSearch) ||
      item.VendorCode?.toLowerCase().includes(lowerSearch) ||
      item.CostCenter?.toLowerCase().includes(lowerSearch) ||
      item.RefPRNo?.toLowerCase().includes(lowerSearch) ||
      item.BudgetLineItem?.toLowerCase().includes(lowerSearch) ||
      item.POAmount?.toString().includes(lowerSearch) ||
      item.POBalanceAmount?.toString().includes(lowerSearch)
    );
  }
  const roFrom = formikRef.current?.values?.ROFrom;
  // 🔹 Calculate PO Balance
  const updatedPOList = preparePOListWithBalance(
    filtered,
    ROAmtList,
    roFrom,
    selectedDepartment
  );

  setPOFilteredData(updatedPOList);

}, [
  POList,
  columnFilters,
  searchTerm,
  selectedDepartment
]);

  useEffect(() => {
  if (formikRef.current?.values?.ROFrom) {
    setSelectedDepartment(formikRef.current.values.ROFrom);
  }
}, [formikRef.current?.values?.ROFrom]);


  const handleColumnFilterChange = (key: string, value: string) => {
      setColumnFilters(prev => ({ ...prev, [key]: value }));
  };

  const validateFormAndTable = async () => {

    const formikValues = formikRef.current?.values;
    let errors: any = {};

    const requiredFields = [
      { key: "Created", label: "Created Date" },
      { key: "InitiatorName", label: "Initiator Name" },
      { key: "PONumber", label: "PO Number" },
      { key: "VendorName", label: "Vendor Name" },
      { key: "VendorCode", label: "Vendor Code" },
      { key: "CostCenter", label: "Cost Center" },
      { key: "POStartDate", label: "PO Start Date" },
      { key: "POEndDate", label: "PO End Date" },
      { key: "POAmount", label: "PO Amount" },
      { key: "POBalanceAmount", label: "PO Balance Amount" },
      { key: "RefPRNo", label: "Ref PR No" },
      { key: "BudgetLineItem", label: "Budget Line Item" },
      { key: "Department", label: "Department" },
      { key: "Company", label: "Company" },
      { key: "Plant", label: "Plant" },
      { key: "ROFrom", label: "RO From" },
      { key: "ContractorScopeDescription", label: "Contractor Scope Description" },
      { key: "ROEndDate", label: "RO End Date" },
      { key: "ROAmount", label: "RO Amount" },
      { key: "Purpose", label: "Purpose" }
    ];

    requiredFields.forEach(field => {
    const value = formikValues?.[field.key];

    if (!value || value.toString().trim() === "") {
        errors[field.key] = `${field.label} is required`;
      }
    });

    if (Object.keys(errors).length > 0) {
      alert(Object.values(errors).join('\n'));
      return false;
    }

    return true;
  };

  return (
    <Formik initialValues={initialvalue} innerRef={formikRef} onSubmit={() => {}}>
      <Form onKeyDown={(e) => {
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
                            {/* BACK */}
                            {visibleButtons.includes('BACK') && (
                              <button
                                type="button"
                                className="btn btn-warning btn-approver btn-forward"
                                onClick={handleClose}
                              >
                                <i className="fa fa-forward"></i> Back
                              </button>
                            )} 

                            {/* CREATE DRAFT */}
                            {visibleButtons.includes('CREATE_DRAFT') && (
                              <button
                                type="button"
                                className="btn btn-warning btn-init"
                                onClick={CreateDraft}
                              >
                                <i className="fa fa-save"></i> Save
                              </button>
                            )}

                            {/* SUBMIT */}
                            {visibleButtons.includes('SUBMIT') && (
                              <button
                                type="button"
                                className="btn btn-warning btn-init"
                                onClick={SubmitRequest}
                              >
                                <i className="fa fa-mail-forward"></i> Submit
                              </button>
                            )}

                            {/* GET APPROVAL FLOW */}
                            {/* {visibleButtons.includes('GET_APPROVAL_FLOW') && (
                              <button
                                type="button"
                                className="btn btn-warning btn-approver"
                                onClick={ReadApprovalFlow_External}
                              >
                                <i className="fa fa-check"></i> Get Approval Flow
                              </button>
                            )} */}

                            {/* WITHDRAW */}
                            {visibleButtons.includes('WITHDRAW') && (
                              <button
                                type="button"
                                className="btn btn-warning btn-withdrawn"
                                onClick={() => SetCommentsFor(1, 'Withdrawn')}
                              >
                                <i className="fa fa-times"></i> Withdrawn
                              </button>
                            )}

                            {/* APPROVE */}
                            {visibleButtons.includes('APPROVE') && (
                              <button
                                type="button"
                                className="btn btn-warning btn-approver"
                                onClick={Approved}
                              >
                                <i className="fa fa-check"></i> Approved
                              </button>
                            )}

                            {/* REWORK */}
                            {visibleButtons.includes('REWORK') && (
                              <button
                                type="button"
                                className="btn btn-warning btn-approver"
                                onClick={() => SetCommentsFor(2, 'Rework')}
                              >
                                <i className="fa fa-undo"></i> Rework
                              </button>
                            )}

                            {/* REJECT */}
                            {visibleButtons.includes('REJECT') && (
                              <button
                                type="button"
                                className="btn btn-warning btn-approver"
                                onClick={() => SetCommentsFor(3, 'Reject')}
                              >
                                <i className="fa fa-times"></i> Reject
                              </button>
                            )}

                            {/* REMARKS */}
                            {visibleButtons.includes('REMARKS') && (
                              <button
                                type="button"
                                className="btn btn-warning btn-approver"
                                onClick={() => SetCommentsFor(4, 'Remarks')}
                              >
                                <i className="fa fa-comments"></i> Remarks
                              </button>
                            )}

                            {/* EDIT PURPOSE (CR-73) */}
                            {visibleButtons.includes('EDIT_PURPOSE') && (
                              <button
                                type="button"
                                className="btn btn-warning"
                                onClick={() => SetCommentsFor(5, 'Purpose')}
                              >
                                <i className="fa fa-edit"></i> Edit Purpose
                              </button>
                            )}

                            <div className="requestStatus">
                              <span>Status: <span id="Status"></span> </span><span className="displayStatus">New Request</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </thead>
                    <tbody className='tbodylabel'>
                      <tr>
                        <td colSpan={3}>
                          <label>Request No</label>
                          <Field name="ReqNo" readOnly className="form-control" />
                        </td>

                        <td colSpan={3}>
                          <label>Request Date</label>
                          <Field name="Created" readOnly className="form-control" />
                            {/* {({ field }) => (
                              <input
                                type="text"
                                readOnly
                                className="form-control"
                                value={field.value ? formatDate(field.value) : ''}
                              />
                            )}
                          </Field> */}
                        </td>
                      </tr>
                      <tr>
                        <th colSpan={12} className="bg-light">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Initiator Details</span>
                            {/* <button
                              type="button"
                              className="btn btn-sm btn-warning"
                              onClick={setInitiatorData}
                            >
                              Edit
                            </button> */}
                          </div>
                        </th>
                      </tr>

                      <tr>
                        <td colSpan={3}>
                          <label>Initiator Name</label>
                          <Field name="InitiatorName" readOnly className="form-control" />
                        </td>
                        <td colSpan={3}>
                          <label>Department</label>
                          <Field name="Department" readOnly className="form-control" />
                        </td>
                        <td colSpan={3}>
                          <label>Company</label>
                          <Field name="Company" readOnly className="form-control">
                            {/* <option value="">Select Company</option>
                            {EmployeeData.map((emp, i) => (
                              <option key={i} value={emp.Company}>
                                {emp.Company}
                              </option>
                            ))}*/}
                          </Field>
                        </td>
                        <td colSpan={3}>
                          <label>Plant</label>
                          <Field name="Plant" readOnly className="form-control">
                            {/* <option value="">Select Plant</option>
                            {EmployeeData.map((emp, i) => (
                              <option key={i} value={emp.OfficeCity.CompanyLocation}>
                                {emp.OfficeCity.CompanyLocation}
                              </option>
                            ))} */}
                          </Field>
                        </td>
                      </tr>

                      <tr>
                        <td colSpan={3}>
                          <label>RO From</label>
                          <Field name="ROFrom" as="select" className="form-control"
                            onChange={(e) => {
                              const value = e.target.value;
                              formikRef.current.setFieldValue("ROFrom", value);
                              setSelectedDepartment(value); // force re-render
                            }}>
                            <option value="Common">Common</option>
                            {EmployeeData.map((emp, i) => (
                              <option key={i} value={emp.DepartmentCode.Department}>
                                {emp.DepartmentCode.Department}
                              </option>
                            ))}
                          </Field>
                        </td>
                        <td colSpan={6}>Note: &quot;RO From&quot; Option
                          <ul>
                            <li><b>Department (e.g., IT, Admin):</b> Raise RO where PR
                              is only for individual department.</li>
                            <li><b>Common:</b> Raise RO where PR is
                              common irrespective of any department.</li>
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <th colSpan={12} className="bg-light">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>PO Details</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-warning"
                              onClick={setPOData}
                            >
                              Edit
                            </button>
                          </div>
                        </th>
                      </tr>

                      <tr>
                        <td colSpan={3}><label>PO Number</label><Field name="PONumber" readOnly className="form-control" /></td>
                        <td colSpan={3}><label>Vendor Name</label><Field name="VendorName" readOnly className="form-control" /></td>
                        <td colSpan={3}><label>Vendor Code</label><Field name="VendorCode" readOnly className="form-control" /></td>
                        <td colSpan={3}><label>Cost Center</label><Field name="CostCenter" readOnly className="form-control" /></td>
                      </tr>

                      <tr>
                        <td colSpan={3}><label>Start Date</label><Field name="POStartDate" readOnly className="form-control">
                          {/* {({ field }) => (<input {...field} readOnly className="form-control" value={field.value ? formatDate(field.value) : ''} />)} */}
                        </Field></td>
                        <td colSpan={3}><label>End Date</label><Field name="POEndDate" readOnly className="form-control">
                          {/* {({ field }) => (<input {...field} readOnly className="form-control" value={field.value ? formatDate(field.value) : ''} />)} */}
                        </Field></td>
                        <td colSpan={3}><label>PO Amount</label><Field name="POAmount" readOnly className="form-control" /></td>
                        <td colSpan={3}><label>PO Balance</label><Field name="POBalanceAmount" readOnly className="form-control" /></td>
                      </tr>

                      <tr>
                        <td colSpan={3}><label>Ref PR Number</label><Field name="RefPRNo" readOnly className="form-control" /></td>
                        <td colSpan={9}><label>Budget Line Item</label><Field name="BudgetLineItem" readOnly className="form-control" /></td>
                      </tr>

                      <tr>
                        <th colSpan={12} className="bg-light">
                          <div className="d-flex justify-content-between align-items-center">
                            <span>RO Details</span>
                            {/* <button
                              type="button"
                              className="btn btn-sm btn-warning"
                              onClick={setDataRO}
                            >
                              Edit
                            </button> */}
                          </div>
                        </th>
                      </tr>

                      <tr>
                        <td colSpan={12}>
                          <label>Contractor to provide labour, equipment and material to perform work as follows, which is within the scope of purchase order/bid package</label>
                          <Field
                            as="textarea"
                            name="ContractorScopeDescription"
                            rows={3}
                            className="form-control auto-height-textarea"
                          />
                        </td>
                      </tr>

                      <tr>
                        <td colSpan={4}>
                          <label>The Contractor agrees to execute completely the order by date :</label>
                          <Field name="ROEndDate" type="date" className="form-control" />
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
                          {/* <ExternalApprovalTrigger roIntentId={roIntentId} lastHandledIntentRef={lastHandledIntentRef} /> */}
                          <label>RO Amount</label>
                          <Field name="ROAmount" readOnly className="form-control">
                            {/* {({ field }: any) => (
                              <input
                                {...field}
                                className="form-control"
                                onBlur={(e) => {
                                  field.onBlur(e);
                                  setRoIntentId(Date.now()); // 🔑 intent signal
                                }}
                              />
                            )} */}
                          </Field>
                        </td>
                        <div className="d-flex justify-content-between align-items-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-warning"
                            onClick={setDataRO}
                          >
                            Set RO Amount 
                          </button>
                        </div>
                      </tr>

                      <tr>
                        <td colSpan={12}>
                          <label>Purpose for this RO</label>
                          <Field
                            as="textarea"
                            name="Purpose"
                            rows={3}
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
                                <th>Next Approver</th>
                                <th>Delegate To</th>
                                <th>Action Date</th>
                                <th>Action</th>
                                <th>Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Summary.map((row, i) => (
                                <tr key={i}>
                                  <td>{row.c1}</td>
                                  <td>{row.c2}</td>
                                  <td>{row.c6}</td>
                                  <td>{row.c3}</td>
                                  <td>{row.c4}</td>
                                  <td>{row.c5}</td>
                                </tr>
                              ))}
                            </tbody>
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
                      <select className="form-select" value={mCompany} onChange={(e) => setMCompany(e.target.value)}>
                        <option value="">Select</option>
                        {EmployeeData.map((emp, i) => (
                          <option key={i} value={emp.Company}>
                            {emp.Company}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <th>Plant</th>
                    <td>
                      <select className="form-select" value={mPlant} onChange={(e) => setMPlant(e.target.value)}>
                        <option value="">Select</option>
                        {EmployeeData.map((emp, i) => (
                          <option key={i} value={emp.OfficeCity.CompanyLocation}>
                            {emp.OfficeCity.CompanyLocation}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <th>RO From</th>
                    <td>
                      <select className="form-select" value={mROFrom} onChange={(e) => setMROFrom(e.target.value)}>
                        <option value="">Select</option>
                        {EmployeeData.map((emp, i) => (
                          <option key={i} value={emp.DepartmentCode.Department}>
                            {emp.DepartmentCode.Department}
                          </option>
                        ))}
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
                <div className="flex items-center gap-4" style={{display: 'flex'}}>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 px-4 py-2 text-sm border-gray-300 rounded-full dashboard-sha focus:outline-none focus:ring-2 focus:ring-red-500"
                    style={{ width: "250px", margin: "10px 10px 10px 0px" }}
                  />
                  <i
                    className="fa fa-refresh cursor-pointer text-xl text-gray-700 hover:text-black"
                    onClick={resetFilters}
                    title="Reset Filters"
                    style={{ paddingLeft: "10px", alignSelf: 'center' }}
                  ></i>
                  {/* <div style={{ marginLeft: "10px" }}>
                    <label>Department</label>
                    <select
                      className="form-control"
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      style={{ width: "200px" }}
                    >
                      <option value="">All Departments</option>
                      {[...new Set(EmployeeData.map(emp => emp.DepartmentCode?.Department))].map((dept, i) => (
                        <option key={i} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div> */}
                </div>
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
                    <tr>
                      <th></th>
                      {["PONumber", "VendorName", "VendorCode", "CostCenter", "POStartDate", "POEndDate", "POAmount", "POBalanceAmount", "RefPRNo", "BudgetLineItem"].map((col) => (
                        <th key={col}>
                          <input
                              type="text"
                              className='mg-form-control'
                              value={columnFilters[col]}
                              onChange={(e) => handleColumnFilterChange(col, e.target.value)}
                              placeholder="Search"
                              style={{ width: "140px" }}
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...pofilteredData].sort((a, b) => b.ID - a.ID).map((po, index) => (
                      <tr key={index}>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={() => UpdatePO(po)}
                          >
                            Select
                          </button>
                        </td>

                        <td>{po.PONumber ?? '-'}</td>
                        <td>{po.VendorName ?? '-'}</td>
                        <td>{po.VendorCode ?? '-'}</td>
                        <td>{po.CostCenter ?? '-'}</td>
                        <td>{formatDate(po.POStartDate ?? '-')}</td>
                        <td>{formatDate(po.POEndDate ?? '-')}</td>
                        <td>{formatAmount(po.POAmount ?? '-')}</td>
                        <td>{formatAmount(po.POBalanceAmount ?? '-')}</td>
                        <td>{po.RefPRNo ?? '-'}</td>
                        <td>{po.BudgetLineItem ?? '-'}</td>
                      </tr>
                    ))}
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
                    <th><span className="mg-required">*</span>RO Amount</th>
                  </tr>
                  <tr>
                    <td><input type="number" className='mg-form-control'  value={mROAmount} onChange={(e) => setMROAmount(Number(e.target.value))} /></td>
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
                      {remarksType !== 5 && <span className="mg-required">*</span>}
                      {remarksType === 5 ? 'Purpose' : 'Remarks'} - <span>{remarksTitle}</span>
                    </label>
                    <textarea rows={10} className="mg-form-control" value={commonRemarks} onChange={(e) => setCommonRemarks(e.target.value)} maxLength={remarksType === 5 ? 2000 : 100}></textarea>
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
      </Form>
    </Formik>
  );
};


