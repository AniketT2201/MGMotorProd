
import { IParameters } from "../../INTERFACE/IParameters";


import { IMgMotorProdProps } from "../../../components/IMgMotorProdProps";

import SPCRUDOPS from "../../DAL/spcrudops";
// import SPCRUD from "./spcrud";
export interface IParametersOps {
    getParameterListData(strFilter: string, sorting: any, props: IParameters): Promise<IParameters>;
    getParameterListDataFiter(strFilter: string, sorting: any, props: IParameters): Promise<IParameters>;
    getParaNotificationUser(strFilter: string, sorting: any, props: IParameters): Promise<IParameters>;

}
export default function ParametersOps() {
    const spCrudOps = SPCRUDOPS();


const getParameterListData = async ( props: IMgMotorProdProps): Promise<IParameters[]> => {
            return await (await spCrudOps).getRootData("ROWorkFlow"
                , "*,Id,Title"
                , ""
                , ""
                , { column: 'Id', isAscending: false }, props).then(results => {
                    let brr: Array<IParameters> = new Array<IParameters>();
                    results.map((item: { Id: any; Title: any; }) => {
                        
                        brr.push({
                            Id: item.Id,
                            Title: item.Title,
                            //Details: item.Details,
                            
                            
                        });
                    });
                    return brr;
                }
                );
        //});
    };
const getParameterListDataFiter = async ( props: IMgMotorProdProps): Promise<IParameters[]> => {
        return await (await spCrudOps).getRootData("ROWorkFlow"
            , "*,Id,Title"
            , ""
            ,  ""
            , { column: 'Id', isAscending: false }, props).then(results => {
                let brr: Array<IParameters> = new Array<IParameters>();
                results.map((item: { Id: any; Title: any; }) => {
                    
                    brr.push({
                        Id: item.Id,
                        Title: item.Title,
                        //Details: item.Details,
                        
                        
                    });
                });
                return brr;
            }
            );
    //});
};
const getParaNotificationUser = async ( props: IMgMotorProdProps): Promise<IParameters[]> => {
        return await (await spCrudOps).getRootData("ROWorkFlow"
            , "*,Id,Title"
            , ""
            ,  ""
            , { column: 'Id', isAscending: false }, props).then(results => {
                let brr: Array<IParameters> = new Array<IParameters>();
                results.map((item: { Id: any; Title: any;}) => {
                    
                brr.push({
                    Id: item.Id,
                    Title: item.Title,
                    //Details: item.Details,
                });
                });
                return brr;
            }
            );
    //});
};
return {
        getParameterListData,getParameterListDataFiter,getParaNotificationUser
    };
}