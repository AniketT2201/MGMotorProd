export default function renderTemplateTable(Template) {
    const uploadTemplate1 = `
    <table class="table table-bordered table-customone" id="templateTable" data-qtycol="4" data-totalcol="7" data-footertotal="2">
      <colgroup>
        <col style="width:5%">
        <col style="width:10%">
        <col style="width:10%">
        <col style="width:10%">
        <col style="width:15%">
        <col style="width:15%">
        <col style="width:10%">
        <col style="width:25%">
      </colgroup>
      <thead>
        <tr>
          <th>Sr.No.</th>
          <th>Invoice No.</th>
          <th>No. of Parts Duplicate</th>
          <th>Total Qty</th>
          <th>Supplier</th>
          <th>GRN Date</th>
          <th>Reversal Value</th>
          <th>Reason</th>
        </tr>
      </thead>
      <tbody></tbody>
      <tfoot>
        <tr>
          <th>Total</th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
        </tr>
      </tfoot>
    </table>
    `;

    const uploadTemplate2 = `
    <table class="table table-bordered table-customone" id="templateTable">
        <colgroup>
            <col style="width:5%">
            <col style="width:10%">
            <col style="width:10%">
            <col style="width:10%">
            <col style="width:15%">
            <col style="width:15%">
            <col style="width:10%">
            <col style="width:25%">
        </colgroup>
        <thead>
            <tr>
                <th>Sr.No.</th>
                <th>Material</th>
                <th>Description</th>
                <th>From Location</th>
                <th>To Location</th>
                <th>Transaction Code</th>
                <th>Qty</th>
                <th>Reason</th>
            </tr>
        </thead>
        <tbody></tbody>
        <tfoot>
        <tr>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
            </tr>
        </tfoot>
    </table>`;

    const uploadTemplate3 = `
        <table class="table table-bordered table-customone" id="templateTable" data-qtycol="4" data-pricecol="6" data-totalcol="7" data-footertotal="2">
        <colgroup>
            <col style="width:5%">
            <col style="width:8%">
            <col style="width:15%">
            <col style="width:8%">
            <col style="width:8%">
            <col style="width:8%">
            <col style="width:8%">
            <col style="width:8%">		
            <col style="width:14%">
            <col style="width:8%">
            <col style="width:8%">
        </colgroup>
        <thead>
            <tr>
                <th>Sr.No.</th>
                <th>Part No.</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Movement</th>
                <th>Price/MAP</th>
                <th>Total Amount</th>
                <th>Cost Center</th>
                <th>Reason</th>
                <th>KD/LC</th>
                <th>Model</th>
            </tr>
        </thead>
        <tbody></tbody>
        
        <tfoot>
            <tr>
                <th class="text-right">Total</th> 
                <th></th> 
                <th></th> 
                <th></th> 
                <th></th> 
                <th></th> 
                <th></th> 
                <th></th> 
                <th></th> 
                <th></th> 
                <th></th> 
            </tr>
        </tfoot>

    </table>
    `

    const uploadTemplate4 = `
        <table class="table table-bordered table-customone" id="templateTable" data-qtycol="4" data-pricecol="6" data-totalcol="7" data-footertotal="2">
        <colgroup>
            <col style="width:5%">
            <col style="width:8%">
            <col style="width:19%">
            <col style="width:8%">
            <col style="width:8%">
            <col style="width:8%">
            <col style="width:8%">
            <col style="width:18%">
            <col style="width:8%">
            <col style="width:8%">
        </colgroup>
        <thead>
            <tr>
                <th>Sr.No.</th>
                <th>Part No.</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Movement</th>
                <th>Price/MAP</th>
                <th>Total Amount</th>
                <th>Reason</th>
                <th>KD/LC</th>
                <th>Model</th>
            </tr>
        </thead>
        <tbody></tbody>
        <tfoot>
            <tr>
                <th class="text-right">Total</th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
            </tr>
        </tfoot>
    </table>
    `

    const uploadTemplate5 = `
        <table class="table table-bordered table-customone" id="templateTable" data-qtycol="5" data-pricecol="7" data-totalcol="8" data-footertotal="2">
        <colgroup>
            <col style="width:5%">
            <col style="width:8%">
            <col style="width:15%">
            <col style="width:8%">
            <col style="width:8%">
            <col style="width:8%">
            <col style="width:8%">
            <col style="width:8%">
            <col style="width:14%">
            <col style="width:8%">
            <col style="width:8%">
        </colgroup>
        <thead>
            <tr>
                <th>Sr.No.</th>
                <th>Part No.</th>
                <th>Description</th>
                <th>UOM</th>
                <th>Qty</th>
                <th>Movement</th>
                <th>Price/MAP</th>
                <th>Total Amount</th>
                <th>Reason</th>
                <th>KD/LC</th>
                <th>Model</th>
            </tr>
        </thead>
        <tbody></tbody>
        <tfoot>
            <tr>
                <th class="text-right">Total</th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
            </tr>
        </tfoot>
    </table>
    `
    const uploadTemplate6 = `
        <table class="table table-bordered table-customone" id="templateTable" data-qtycol="6" data-pricecol="7" data-totalcol="8" data-footertotal="2">
        <colgroup>
            <col style="width:5%">
            <col style="width:10%">
            <col style="width:15%">
            <col style="width:10%">
            <col style="width:10%">
            <col style="width:10%">
            <col style="width:10%">
            <col style="width:10%">
            <col style="width:20%">
        </colgroup>
        <thead>
            <tr>
                <th>Sr.No.</th>
                <th>Part No.</th>
                <th>Description</th>
                <th>UOM</th>
                <th>Material Class</th>
                <th>COGI QTY</th>
                <th>Std. Price</th>
                <th>Value of Negative Variance (RS)</th>
                <th>Reason for Variance</th>
            </tr>
        </thead>
        <tbody></tbody>
        <tfoot>
            <tr>
                <th>Total</th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
            </tr>
        </tfoot>
    </table>
    `
    const uploadTemplate7 = `
        <table class="table table-bordered table-customone" id="templateTable">
        <colgroup>
            <col style="width:5%">
            <col style="width:10%">
            <col style="width:15%">
            <col style="width:15%">
            <col style="width:10%">
            <col style="width:10%">
            <col style="width:20%">
            <col style="width:15%">
        </colgroup>
        <thead>
            <tr>
                <th>Sr.No.</th>
                <th>Part No.</th>
                <th>Description</th>
                <th>Interface Error Messaage</th>
                <th>Wrong Data</th>
                <th>Correct Data for Update</th>
                <th>Reason</th>
                <th>Vendor</th>
            </tr>
        </thead>
        <tbody></tbody>
        <tfoot>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
        </tfoot>
    </table>
    `

    if (Template === 'uploadTemplate1') {
        return uploadTemplate1;
    } else if (Template === 'uploadTemplate2') {
        return uploadTemplate2;
    } else if (Template === 'uploadTemplate3') {
        return uploadTemplate3;
    } else if (Template === 'uploadTemplate4') {
        return uploadTemplate4;
    } else if (Template === 'uploadTemplate5') {
        return uploadTemplate5;
    } else if (Template === 'uploadTemplate6') {
        return uploadTemplate6;
    } else if (Template === 'uploadTemplate7') {
        return uploadTemplate7;
    } else {
        return "";
    }

}
