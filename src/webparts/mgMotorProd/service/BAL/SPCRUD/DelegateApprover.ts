import { IDelegateApprover } from "../../INTERFACE/IDelegateApprover";
import { IMgMotorProdProps } from "../../../components/IMgMotorProdProps";
import SPCRUDOPS from "../../DAL/spcrudops";
export interface IIITRequestsOps {
    getDelegateApprover(props: IDelegateApprover): Promise<IDelegateApprover>;
}



const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // This gives dd/mm/yyyy format
};

export default function IDelegateApproverops() {
    const spCrudOps = SPCRUDOPS();

    const getDelegateApprover = async (ArtId: string | number, props: IMgMotorProdProps): Promise<IDelegateApprover[]> => {
        return await (await spCrudOps).getRootData(
            "LeaveDelegation",
            'Title,DelegateFromId,DelegateFrom/Title,DelegateFrom/EMail,DelegateToId,DelegateTo/Title,FromDate,ToDate,Status,DelegateFromEmpID,DelegateToEmpID,AppList',
            'DelegateFrom,DelegateTo',
            `DelegateFrom/EMail  eq '`+ArtId+`' and Status eq 'Active'`,
            { column: 'ID', isAscending: true },
            props
        ).then(results => {
            let brr: Array<IDelegateApprover> = [];

            results.map((item: {
                Title?: any,
                DelegateFrom?: any,
                DelegateTo?: any,
                DelegateToId?: any,
                DelegateFromId?: any,
                DelegateToEmpID?: any,
                DelegateFromEmpID?: any,
                FromDate?: any,
                ToDate?: any,
                Status?: any,
                AppList?: any
            }) => {
                // Parse dates
                const fromDate = formatDate(item.FromDate);
                const toDate = formatDate(item.ToDate);
                const currentDate = formatDate(new Date());
                const Applistdata = item.AppList.split(';').includes('RO');
                // Check if currentDate is between fromDate and toDate (inclusive)
                const isInRange = currentDate >= fromDate && currentDate <= toDate && Applistdata == true;

                if (isInRange) {
                    brr.push({
                        Title: item.Title,
                        DelegateFrom: item.DelegateFrom,
                        DelegateToId: item.DelegateToId,
                        DelegateFromId: item.DelegateFromId,
                        DelegateTo: item.DelegateTo, // corrected: previously was item.DelegateFrom
                        DelegateToEmpID: item.DelegateToEmpID,
                        DelegateFromEmpID: item.DelegateFromEmpID,
                        FromDate: item.FromDate,
                        ToDate: item.ToDate,
                        Status: item.Status,
                        AppList: item.AppList
                    });
                }
            });

            return brr;
        });
    };

    const getOffboardingApprover = async (ArtId: string | number, props: IMgMotorProdProps): Promise<IDelegateApprover[]> => {
        return await (await spCrudOps).getRootData(
            "OffboardingDelegation",
            'Title,DelegateFromId,DelegateFrom/Title,DelegateFrom/EMail,DelegateToId,DelegateTo/Title,DelegateFromEmpID,DelegateToEmpID,AppList,RelievingDate',
            'DelegateFrom,DelegateTo',
            `DelegateFrom/EMail  eq '`+ArtId+`' and Status eq 'Active'`,
            { column: 'ID', isAscending: true },
            props
        ).then(results => {
            let brr: Array<IDelegateApprover> = [];

            results.map((item: {
                Title?: any,
                DelegateFrom?: any,
                DelegateTo?: any,
                DelegateToId?: any,
                DelegateFromId?: any,
                DelegateToEmpID?: any,
                DelegateFromEmpID?: any,
                RelievingDate?:any                
            }) => {                
                const fromDate = formatDate(item.RelievingDate);                
                const currentDate = formatDate(new Date());                                
                const isInRange = currentDate >= fromDate;

                if (isInRange) {
                    brr.push({
                        Title: item.Title,
                        DelegateFrom: item.DelegateFrom,
                        DelegateToId: item.DelegateToId,
                        DelegateFromId: item.DelegateFromId,
                        DelegateTo: item.DelegateTo, // corrected: previously was item.DelegateFrom
                        DelegateToEmpID: item.DelegateToEmpID,
                        DelegateFromEmpID: item.DelegateFromEmpID                        
                    });
                }
            });

            return brr;
        });
    };

    return {
        getDelegateApprover,getOffboardingApprover
    };
}
