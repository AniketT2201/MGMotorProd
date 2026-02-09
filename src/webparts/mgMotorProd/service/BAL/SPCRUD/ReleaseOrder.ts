import { IRO } from "../../INTERFACE/IRO";
import { IMgMotorProdProps } from "../../../components/IMgMotorProdProps";
import SPCRUDOPS from "../../DAL/spcrudops";
import { IROFormFields } from "../../INTERFACE/IROFormFields";
export interface IReleaseOrderRequestsOps {
    getPOData(sorting: any, props: IMgMotorProdProps, filter:string): Promise<any>;
    getRODataById(sorting: any, props: IMgMotorProdProps, filter:string): Promise<any>;
    getROAmountTracking(sorting: any, props: IMgMotorProdProps, filter:string): Promise<any>;
}

export default function ReleaseOrderRequestsOps() {
    const spCrudOps = SPCRUDOPS();

    // const getIROData = async (strFilter: string, sorting: any,props: IItProps): Promise<IRO[]> => {
    const getPOData = async ( sorting: any, props: IMgMotorProdProps, filter: string): Promise<any[]> => {
        try {
            const spOps = await spCrudOps;
            const results = await spOps.getData(
            'PO_Master_List',
            '*,ID,VendorName,VendorCode,PONumber,POAmount,POBalanceAmount,POStartDate,POEndDate,Department,CostCenter,RefPRNo,BudgetLineItem,Title,Created,Author/Title',
            'Author',
            filter,
            sorting,
            props
            );

            const poArray = results.map((item: any) => ({
                ID: item?.ID ?? null,
                VendorName: item?.VendorName ?? null,
                VendorCode: item?.VendorCode ?? null,
                PONumber: item?.PONumber ?? null,
                POAmount: item?.POAmount ?? null,
                POBalanceAmount: item?.POBalanceAmount ?? null,
                POStartDate: item?.POStartDate ?? null,
                POEndDate: item?.POEndDate ?? null,
                Department: item?.Department ?? null,
                CostCenter: item?.CostCenter ?? null,
                RefPRNo: item?.RefPRNo ?? null,
                BudgetLineItem: item?.BudgetLineItem ?? null,
                Author: item?.Author?.Title ?? null,
                Title: item?.Title ?? null,
                Created: item?.Created ?? null
            }));

            return poArray;
        } catch (error) {
            console.error('Error fetching PO data:', error);
            return [];
        }
    };

    const getRODataById = async (sorting: any, props: IMgMotorProdProps, filter: string): Promise<any[]> => {
        try {
            const spOps = await spCrudOps;
            const results = await spOps.getData(
            'ROList',
            '*,ID,ReqNo,Department,Company,Plant,ROFrom,Status,Stage,ApprovalFlow,ApprovalFlow_External,PODetails,ROAmount,ROEndDate,Purpose,Summary,Created,InitiatorName/Title,InitiatorName/EMail,NextApprover/Title,NextApprover/EMail,DelegationApprover/Title,DelegationApprover/EMail,AttachmentFiles',
            'InitiatorName,NextApprover,DelegationApprover,AttachmentFiles',
            filter,
            sorting,
            props
            );

            const roArray = results.map((item: any) => ({
                ID: item?.ID ?? null,
                ReqNo: item?.ReqNo ?? null,
                Department: item?.Department ?? null,
                Company: item?.Company ?? null,
                Plant: item?.Plant ?? null,
                ROFrom: item?.ROFrom ?? null,
                Status: item?.Status ?? null,
                Stage: item?.Stage ?? null,
                ApprovalFlow: item?.ApprovalFlow ?? null,
                ApprovalFlow_External: item?.ApprovalFlow_External ?? null,
                PODetails: item?.PODetails ?? null,
                ROAmount: item?.ROAmount ?? null,
                ROEndDate: item?.ROEndDate ?? null,
                Purpose: item?.Purpose ?? null,
                Summary: item?.Summary ?? null,
                Created: item?.Created ?? null,
                ContractorScopeDescription: item?.ContractorScopeDescription ?? null,
                InitiatorName: item?.InitiatorName?.Title ?? null,
                InitiatorEmail: item?.InitiatorName?.EMail ?? null,
                NextApprover: item?.NextApprover?.Title ?? null,
                NextApproverEmail: item?.NextApprover?.EMail ?? null,
                DelegationApprover: item?.DelegationApprover?.Title ?? null,
                DelegationApproverEmail: item?.DelegationApprover?.EMail ?? null,
                AttachmentFiles: item.AttachmentFiles ?? null,
            }));

            return roArray;
        } catch (error) {
            console.error('Error fetching RO Data By Id data:', error);
            return [];
        }
    };

    const getROAmountTracking = async (sorting: any, props: IMgMotorProdProps, filter: string): Promise<any[]> => {
        try {
            const spOps = await spCrudOps;

            const results = await spOps.getData(
            'ROAmountTracking_List',
            '*,ID,Title,PONumber,RONumber,Amount,Created',
            '',
            filter,
            sorting,
            props
            );

            const amountArray = results.map((item: any) => ({
                ID: item?.ID ?? null,
                Title: item?.Title ?? null,
                PONumber: item?.PONumber ?? null,
                RONumber: item?.RONumber ?? null,
                Amount: item?.Amount ?? null,
                Created: item?.Created ?? null
            }));

            return amountArray;
        } catch (error) {
            console.error('Error fetching RO Amount Tracking data:', error);
            return [];
        }
    };



    

    
    return {
        getPOData,getRODataById,getROAmountTracking
    };
}