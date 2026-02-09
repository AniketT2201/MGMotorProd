// import { WebPartContext } from "@microsoft/sp-webpart-base";
// import { IDeviationDevProps } from "../../INTERFACES/IDeviationDevProps";
import { IDeviationDevProps } from "../../INTERFACE/IDeviationDevProps";
// import {IPA}

import { IEmailProperties } from "@pnp/sp/sputilities";
import { sp } from "@pnp/sp";

export interface IMonth {
    Id: number;
    Title: string;
    ShortMonth: string;
    NarrowMonth: string;
}

export interface TypedHash<T> {
    [key: string]: T;
}
// item:any;

export interface IUtilities {
    filterData(data: any[], filterValue: string, filterColumns: string[]): Promise<any[]>;
    MonthColl(): Array<IMonth>;
    // hideShow(hideIt: boolean, props: WebPartContext, loadingMessage: string): void;
    sendEmail(to: string[], cc: string[], bcc: string[], subject: string, body: string, AdditionalHeaders: TypedHash<string>
        , props: IDeviationDevProps, from?: string): void;
}

export default function Utilities(): Promise<IUtilities> {
    return new Promise((resolve) => {
        const utilities: IUtilities = {
            filterData: async (data: any[], filterValue: string, filterColumns: string[]): Promise<any[]> => {
                if (!filterValue) {
                    return data;
                }

                const searchValue = filterValue.toLowerCase();
                return data.filter((item) => {
                    return filterColumns.some((column) => {
                        const value = item[column];
                        if (value === null || value === undefined) {
                            return false;
                        }
                        return value.toString().toLowerCase().includes(searchValue);
                    });
                });
            },
            MonthColl: () => {
                let Years: Array<IMonth> = new Array<IMonth>();
                let dateObj = new Date();

                for (let m = 0; m <= 11; m++) {
                    let particularDate = new Date(dateObj.getFullYear(), m, 1);
                    Years.push({
                        Id: m + 1,
                        Title: particularDate.toLocaleString('en-us', { month: 'long' }),
                        ShortMonth: particularDate.toLocaleString('en-us', { month: 'short' }),
                        NarrowMonth: particularDate.toLocaleString('en-us', { month: 'narrow' })
                    });
                }

                return Years;
            },
            sendEmail: async (to: string[], cc: string[], bcc: string[], subject: string, body: string
                , additionalHeaders: TypedHash<string>, _props: IDeviationDevProps, from?: string) => {

                const emailProps: IEmailProperties = {
                    To: to,
                    CC: cc,
                    BCC: bcc,
                    Subject: subject,
                    Body: body
                };

                if (from != null && from != undefined && from.trim() != "") {
                    emailProps.From = from;
                }
                if (additionalHeaders != null && additionalHeaders != undefined) {
                    emailProps.AdditionalHeaders = additionalHeaders;
                }
                
                return await sp.utility.sendEmail(emailProps);
            }
        };
        resolve(utilities);
    });
}