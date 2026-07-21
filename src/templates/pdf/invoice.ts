export interface InvoiceData {
  studioName: string;
  studioAddress: string;
  invoiceNumber: string;
  date: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  items: Array<{
    description: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: string;
}

export const generateInvoiceHtml = (data: InvoiceData): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${data.invoiceNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          color: #1f2937;
          margin: 0;
          padding: 40px;
          background-color: #ffffff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #f3f4f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .studio-details h1 {
          margin: 0;
          font-size: 24px;
          color: #111827;
        }
        .studio-details p {
          margin: 4px 0;
          color: #6b7280;
          font-size: 14px;
        }
        .invoice-details {
          text-align: right;
        }
        .invoice-details h2 {
          margin: 0;
          font-size: 28px;
          color: #6366f1; /* Brand color */
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .bill-to {
          margin-bottom: 30px;
        }
        .bill-to h3 {
          font-size: 14px;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .bill-to p {
          margin: 4px 0;
          font-size: 15px;
          font-weight: 500;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background-color: #f9fafb;
          text-align: left;
          padding: 12px;
          font-size: 13px;
          text-transform: uppercase;
          color: #4b5563;
          border-bottom: 1px solid #e5e7eb;
        }
        td {
          padding: 16px 12px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
        }
        .text-right {
          text-align: right;
        }
        .totals-container {
          width: 100%;
          display: flex;
          justify-content: flex-end;
        }
        .totals-table {
          width: 300px;
        }
        .totals-table td {
          padding: 8px 12px;
          border-bottom: none;
        }
        .total-row td {
          border-top: 2px solid #e5e7eb;
          font-weight: 700;
          font-size: 18px;
          color: #111827;
          padding-top: 16px;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          color: #9ca3af;
          font-size: 13px;
          border-top: 1px solid #f3f4f6;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="studio-details">
          <h1>${data.studioName}</h1>
          <p>${data.studioAddress}</p>
        </div>
        <div class="invoice-details">
          <h2>INVOICE</h2>
          <p><strong>#${data.invoiceNumber}</strong></p>
          <p>Date: ${data.date}</p>
        </div>
      </div>

      <div class="bill-to">
        <h3>Billed To:</h3>
        <p>${data.clientName}</p>
        ${data.clientPhone ? `<p>${data.clientPhone}</p>` : ''}
        ${data.clientEmail ? `<p>${data.clientEmail}</p>` : ''}
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">$${item.price.toFixed(2)}</td>
              <td class="text-right">$${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-container">
        <table class="totals-table">
          <tr>
            <td>Subtotal</td>
            <td class="text-right">$${data.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Tax</td>
            <td class="text-right">$${data.tax.toFixed(2)}</td>
          </tr>
          <tr class="total-row">
            <td>Grand Total</td>
            <td class="text-right">$${data.total.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div class="footer">
        <p>Thank you for choosing ${data.studioName}!</p>
        ${data.paymentMethod ? `<p>Paid via ${data.paymentMethod}</p>` : ''}
      </div>
    </body>
    </html>
  `;
};
