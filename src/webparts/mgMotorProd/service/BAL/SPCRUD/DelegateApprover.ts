import { IDelegateApprover } from "../../INTERFACE/IDelegateApprover";
import { IMgMotorProdProps } from "../../../components/IMgMotorProdProps";
import SPCRUDOPS from "../../DAL/spcrudops";
export interface IIITRequestsOps {
    getDelegateApprover(props: IDelegateApprover): Promise<IDelegateApprover>;
}

export default function IDelegateApproverops() {
    const spCrudOps = SPCRUDOPS();

    const getDelegateApprover = async (ArtId: string | number, props: IMgMotorProdProps): Promise<IDelegateApprover[]> => {
        return await (await spCrudOps).getRootData(
            "LeaveDelegation",
            'Title,DelegateFromId,DelegateFrom/Title,DelegateFrom/EMail,DelegateToId,DelegateTo/Title,FromDate,ToDate,Status,DelegateFromEmpID,DelegateToEmpID',
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
                Status?: any
            }) => {
                // Parse dates
                const fromDate = new Date(item.FromDate);
                const toDate = new Date(item.ToDate);
                const currentDate = new Date();

                // Check if currentDate is between fromDate and toDate (inclusive)
                const isInRange = currentDate >= fromDate && currentDate <= toDate;

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
                        Status: item.Status
                    });
                }
            });

            return brr;
        });
    };

    return {
        getDelegateApprover
    };
}
