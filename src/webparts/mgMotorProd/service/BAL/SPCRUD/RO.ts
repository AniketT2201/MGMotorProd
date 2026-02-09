import { IRO } from "../../INTERFACE/IRO";
import { IMgMotorProdProps } from "../../../components/IMgMotorProdProps";
import SPCRUDOPS from "../../DAL/spcrudops";
export interface IIITRequestsOps {
    getIROData(props: any): Promise<any>;
    getRODatafilter(props: any): Promise<any>;
    getRODatabyId(ArtId: string | number, listname: string , props: IMgMotorProdProps): Promise<any[]>;
}

export default function RORequestsOps() {
    const spCrudOps = SPCRUDOPS();

    // const getIROData = async (strFilter: string, sorting: any,props: IItProps): Promise<IRO[]> => {
    const getIROData = async (sorting: any, props: IMgMotorProdProps, filter:string): Promise<any[]> => {
        try {
            const spOps = await spCrudOps;
            const results = await spOps.getData(
            'ROList',
            '*,InitiatorName/Title,InitiatorName/EMail,NextApprover/Title,NextApprover/EMail,DelegationApprover/Title,DelegationApprover/EMail',
            'InitiatorName,NextApprover,DelegationApprover',
            filter,
            sorting,
            props
            );

            const roArray = results.map((item: any) => ({
                ID: item?.ID ?? null,
                Title: item?.Title ?? null,
                ReqNo: item?.ReqNo ?? null,
                Department: item?.Department ?? null,
                Company: item?.Company ?? null,
                Plant: item?.Plant ?? null,
                ROFrom: item?.ROFrom ?? null,
                Status: item?.Status ?? null,
                Stage: item?.Stage ?? null,
                ContractorScopeDescription: item?.ContractorScopeDescription ?? null,
                ApprovalFlow: item?.ApprovalFlow ?? null,
                ApprovalFlow_External: item?.ApprovalFlow_External ?? null,
                PODetails: item?.PODetails ?? null,
                ROAmount: item?.ROAmount ?? null,
                ROEndDate: item?.ROEndDate ?? null,
                Purpose: item?.Purpose ?? null,
                Summary: item?.Summary ?? null,
                Created: item?.Created ?? null,
                InitiatorName: item?.InitiatorName?.Title ?? null,
                InitiatorEmail: item?.InitiatorName?.EMail ?? null,
                InitiatorEmployeeID: item?.InitiatorEmployeeID ?? null,
                NextApprover: item?.NextApprover?.Title ?? null,
                NextApproverEmail: item?.NextApprover?.EMail ?? null,
                NextApproverEmpID: item?.NextApproverEmpID ?? null,
                DelegationApprover: item?.DelegationApprover?.Title ?? null,
                DelegationApproverEmail: item?.DelegationApprover?.EMail ?? null,
                DelegateApproverEmpID: item?.DelegateApproverEmpID ?? null,
            }));

            return roArray;
        } catch (error) {
            console.error('Error fetching RO Data By Id data:', error);
            return [];
        }
    };

    const getRODatafilter = async (ArtId: string | number, listname: string , props: IMgMotorProdProps): Promise<any[]> => {
        return await (await spCrudOps).getData(listname
            , '*,ID,ReqNo,Department,Company,Plant,ROFrom,Status,Stage,ApprovalFlow,ApprovalFlow_External,PODetails,ROAmount,ROEndDate,Purpose,Summary,Created,InitiatorName/Title,InitiatorName/EMail,NextApprover/Title,NextApprover/EMail,DelegationApprover/Title,DelegationApprover/EMail'
            , 'InitiatorName,NextApprover,DelegationApprover'
            , "Id eq '" + ArtId + "'"
            // , sorting,
            , { column: 'Id', isAscending: true },
            props).then(results => {
                let brr: Array<any> = new Array<any>();
                results.map((item: any) => {
                    brr.push({
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
                    InitiatorName: item?.InitiatorName?.Title ?? null,
                    InitiatorEmail: item?.InitiatorName?.EMail ?? null,
                    NextApprover: item?.NextApprover?.Title ?? null,
                    NextApproverEmail: item?.NextApprover?.EMail ?? null,
                    DelegationApprover: item?.DelegationApprover?.Title ?? null,
                    DelegationApproverEmail: item?.DelegationApprover?.EMail ?? null,
                    Author: item?.Author?.Title ?? null,
                    Title:item?.Title,
                    Created:item?.Created??null
                    });
                });
                return brr;
            }
            );
    };

    const getRODatabyId = async (ArtId: string | number, listname: string , props: IMgMotorProdProps): Promise<any[]> => {
        return await (await spCrudOps).getData(listname
            , '*,ID,ReqNo,Department,Company,Plant,ROFrom,Status,Stage,ApprovalFlow,ApprovalFlow_External,PODetails,ROAmount,ROEndDate,Purpose,Summary,Created,InitiatorName/Title,InitiatorName/EMail,NextApprover/Title,NextApprover/EMail,DelegationApprover/Title,DelegationApprover/EMail'
            , 'InitiatorName,NextApprover,DelegationApprover'
            , "Id eq '" + ArtId + "'"
            // , sorting,
            , { column: 'Id', isAscending: true },
            props).then(results => {
                let brr: Array<any> = new Array<any>();
                results.map((item: any) => {
                    brr.push({
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
                    InitiatorName: item?.InitiatorName?.Title ?? null,
                    InitiatorEmail: item?.InitiatorName?.EMail ?? null,
                    NextApprover: item?.NextApprover?.Title ?? null,
                    NextApproverEmail: item?.NextApprover?.EMail ?? null,
                    DelegationApprover: item?.DelegationApprover?.Title ?? null,
                    DelegationApproverEmail: item?.DelegationApprover?.EMail ?? null,
                    Author: item?.Author?.Title ?? null,
                    Title:item?.Title,
                    Created:item?.Created??null
                    });
                });
                return brr;
            }
            );
    };
    return {
        getIROData, getRODatafilter, getRODatabyId
    };
}