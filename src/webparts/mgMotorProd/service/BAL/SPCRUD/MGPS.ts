import { IMGPS } from "../../INTERFACE/IMGPS";
import { IMgMotorProdProps } from "../../../components/IMgMotorProdProps";
import SPCRUDOPS from "../../DAL/spcrudops";

export interface IIITRequestsOps {
    getIMGPSData(props: IMGPS): Promise<IMGPS>;
    getMGPSDatafilter(props: IMGPS): Promise<IMGPS>;
    getAllIMGPSData(props: IMGPS): Promise<IMGPS>;
}

export default function MGPSRequestsOps() {
    const spCrudOps = SPCRUDOPS();

    /** --------------------------------------------------------
     *  Common Fields (Select & Expand)
     * -------------------------------------------------------- */
    const COMMON_SELECT = `
        ID,Title,ReqNo,Status,Stage,EmpNo,EmpName/Title,EmpName/Id,
        Department,CostCenter,Location,MaterialFor,RGPReturnDate,ItemDetails,
        TotalAmt,AssetIndicator,ShipmentMode,ShipmentType,DRNo,FreightChargesBy,
        FreightChargesAmt,ConsigneeDetails,InitiatorDetails,Purpose,
        RejectWithdrawnComment,ReworkComment,Summary,flagEmail,
        NextApprover/Title,NextApprover/Id,DelegatorApprover/Title,
        DelegatorApprover/Id,ApprovalFlow,LRNo,LRDate,CarrierDetails,
        ReturnLRNo,ReturnLRDate,ExitDate,EntryDate,GeneralAttachmentList,DMTAssociated,
        isSecurityPrint,requiredDateExtension,SendEmail,Created,Modified,
        NextApproverEmpID,DelegateApproverEmpID
    `.replace(/\s+/g, '');

    const COMMON_EXPAND = "EmpName,NextApprover,DelegatorApprover";

    /** --------------------------------------------------------
     *  Mapper (Centralized)
     * -------------------------------------------------------- */
    const mapIMGPSItem = (item: any): IMGPS => {
        let total = 0;

        try {
            const parsed = JSON.parse(item.ItemDetails ?? "[]");
            parsed.forEach((i: any) => (total += i.c6 ?? 0));
        } catch (err) {
            console.error("Error parsing ItemDetails:", item.ID, err);
        }

        return {
            ID: item.ID,
            Title: item.Title ?? null,
            ReqNo: item.ReqNo ?? null,
            EmpID: item.EmpNo ?? null,
            EmpName: item.EmpName?.Title ?? null,
            Department: item.Department ?? null,
            CostCenter: item.CostCenter ?? null,
            Items: item.ItemDetails ?? null,
            Status: item.Status ?? null,
            Created: item.Created ?? null,
            Total: total,
            Date: item.Created ?? null,
            Summary: item.Summary ?? null,
            Stage: item.Stage ?? null,
            NextApproverEmpID: item.NextApproverEmpID ?? null,
            DelegateApproverEmpID: item.DelegateApproverEmpID ?? null,
            RGPReturnDate: item.RGPReturnDate ?? null,
            MaterialFor: item.MaterialFor ?? null,
            TotalAmt: item.TotalAmt ?? null,
            AssetIndicator: item.AssetIndicator ?? null,
            ShipmentMode: item.ShipmentMode ?? null,
            ShipmentType: item.ShipmentType ?? null,
            DRNo: item.DRNo ?? null,
            FreightChargesBy: item.FreightChargesBy ?? null,
            FreightChargesAmt: item.FreightChargesAmt ?? null,
            ConsigneeDetails: item.ConsigneeDetails ?? null,
            InitiatorDetails: item.InitiatorDetails ?? null,
            Purpose: item.Purpose ?? null,
            RejectWithdrawnComment: item.RejectWithdrawnComment ?? null,
            ReworkComment: item.ReworkComment ?? null,
            flagEmail: item.flagEmail ?? 0,
            NextApprover: item.NextApprover?.Title ?? null,
            DelegatorApprover: item.DelegatorApprover?.Title ?? null,
            ApprovalFlow: item.ApprovalFlow ?? null,
            LRNo: item.LRNo ?? null,
            LRDate: item.LRDate ?? null,
            CarrierDetails: item.CarrierDetails ?? null,
            ReturnLRNo: item.ReturnLRNo ?? null,
            ReturnLRDate: item.ReturnLRDate ?? null,
            ExitDate: item.ExitDate ?? null,
            EntryDate: item.EntryDate ?? null,
            GeneralAttachmentList: item.GeneralAttachmentList ?? null,
            isSecurityPrint: item.isSecurityPrint ?? 0,
            requiredDateExtension: item.requiredDateExtension ?? 0,
            SendEmail: item.SendEmail ?? null,
            AttachmentFiles: item.AttachmentFiles ?? null,
            EmpNameEmail: item.EmpName?.EMail ?? null,
            Author: item.Author?.Title ?? null,
            DmtAssocaite: item.DMTAssociated ?? "",
            Price: item.TotalAmt ?? 0
        };
    };

    /** --------------------------------------------------------
     *  1️⃣ getIMGPSData
     * -------------------------------------------------------- */
    const getIMGPSData = async (
        sorting: any,
        props: IMgMotorProdProps,
        filter: string
    ): Promise<IMGPS[]> => {
        const results = await (await spCrudOps).getData(
            "MGPSList",
            COMMON_SELECT,
            COMMON_EXPAND,
            filter,
            sorting,
            props
        );
        return results.map(mapIMGPSItem);
    };

    /** --------------------------------------------------------
     *  2️⃣ getMGPSDatafilter
     * -------------------------------------------------------- */
    const getMGPSDatafilter = async (
        ArtId: string | number,
        props: IMgMotorProdProps
    ): Promise<IMGPS[]> => {
        const results = await (await spCrudOps).getData(
            "MGPSList",
            `${COMMON_SELECT},Author/Title,Author/Id,EmpName/EMail,AttachmentFiles`,
            `${COMMON_EXPAND},Author,AttachmentFiles`,
            `Id eq '${ArtId}'`,
            { column: "Order0", isAscending: true },
            props
        );
        return results.map(mapIMGPSItem);
    };

    /** --------------------------------------------------------
     *  3️⃣ getAllIMGPSData (Dynamic List)
     * -------------------------------------------------------- */
    const getAllIMGPSData = async (
        sorting: any,
        props: IMgMotorProdProps,
        filter: string,
        ListName: string
    ): Promise<IMGPS[]> => {
        const results = await (await spCrudOps).getData(
            ListName,
            COMMON_SELECT,
            COMMON_EXPAND,
            filter,
            sorting,
            props
        );
        return results.map(mapIMGPSItem);
    };

    return {
        getIMGPSData,
        getMGPSDatafilter,
        getAllIMGPSData
    };
}
