const COMPANY_DETAILS = {
  name: 'HESH MEDIA',
  address: 'Prem Complex, Circular Rd, Medical Enclave, Amritsar, Punjab 143001',
  phone: '7888338037',
  bankName: 'HDFC BANK',
  accountNumber: '9876543210',
  branchAndIfsc: 'ASR, HDFC12345',
};

const TERMS_AND_CONDITIONS = [
  'Goods once sold will not be taken back or exchanged.',
  'Interest @ 18% p.a. will be charged if payment is delayed.',
  'Subject to local jurisdiction only.',
];

export function printInvoiceDocument({ invoice, client, items = [] }) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');

  document.body.appendChild(iframe);

  const printDocument = iframe.contentWindow?.document;

  if (!printDocument || !iframe.contentWindow) {
    document.body.removeChild(iframe);
    throw new Error('Unable to prepare the print view.');
  }

  iframe.onload = () => {
    const printWindow = iframe.contentWindow;

    if (!printWindow) {
      cleanup();
      return;
    }

    printWindow.onafterprint = cleanup;

    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 150);
  };

  printDocument.open();
  printDocument.write(getInvoicePrintHtml({ invoice, client, items }));
  printDocument.close();

  const cleanup = () => {
    window.setTimeout(() => {
      iframe.remove();
    }, 250);
  };

}

function getInvoicePrintHtml({ invoice, client, items }) {
  const taxableAmount = Number(invoice.total_amount || 0);
  const grandTotal = taxableAmount;

  const billedToName = client?.brand_name || invoice.clientName || 'Unknown client';
  const billedToAddress = client?.location || 'Address Not Provided';
  const amountInWords = convertNumberToWords(grandTotal);

  const itemRows = items.length
    ? items
        .map(
          (item, index) => `
              <tr>
                <td class="col-serial">${index + 1}</td>
                <td class="col-description">
                  <div class="item-name">${escapeHtml(item.service_name || '-')}</div>
                  ${
                    item.description
                      ? `<div class="item-description">${escapeHtml(item.description)}</div>`
                      : ''
                  }
                </td>
                <td class="col-qty">${escapeHtml(String(item.quantity || 0))}</td>
                <td class="col-rate">${escapeHtml(formatCurrency(item.unit_price))}</td>
                <td class="col-amount">${escapeHtml(formatCurrency(item.total))}</td>
              </tr>
          `,
        )
        .join('')
    : `
      <tr>
        <td class="empty-state" colspan="5">No invoice items available.</td>
      </tr>
    `;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(invoice.invoice_number)} - Invoice</title>
        <style>
          @page {
            size: A4;
            margin: 12mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            color: #1f2937;
            font-family: "Segoe UI", Arial, sans-serif;
            background: #ffffff;
          }

          .invoice-sheet {
            width: 100%;
            min-height: calc(297mm - 24mm);
            padding: 2mm 1mm 0;
          }

          .topbar {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
          }

          .company-name,
          .invoice-title {
            margin: 0;
            color: #334155;
            letter-spacing: 0.16em;
            font-size: 31px;
            font-weight: 700;
          }

          .company-meta,
          .invoice-meta {
            margin-top: 10px;
            color: #64748b;
            font-size: 12px;
            line-height: 1.6;
          }

          .invoice-meta {
            text-align: right;
          }

          .section-divider {
            margin: 22px 0 14px;
            border-top: 1px solid #dbe3ee;
          }

          .bill-to {
            min-height: 78px;
          }

          .section-label {
            margin: 0 0 8px;
            color: #64748b;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.16em;
          }

          .bill-to-name {
            margin: 0;
            color: #334155;
            font-size: 15px;
            font-weight: 700;
          }

          .bill-to-address {
            margin-top: 6px;
            color: #64748b;
            font-size: 12px;
            line-height: 1.6;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          .items-table {
            margin-top: 18px;
          }

          .items-table thead th {
            padding: 0 10px 10px;
            border-bottom: 2px solid #475569;
            color: #64748b;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .items-table tbody td {
            padding: 10px 10px;
            border-bottom: 1px solid #e2e8f0;
            color: #475569;
            font-size: 12px;
            vertical-align: top;
          }

          .items-table tbody tr:last-child td {
            border-bottom: none;
          }

          .col-serial,
          .col-qty {
            width: 8%;
            text-align: center;
          }

          .col-rate,
          .col-amount {
            width: 15%;
            text-align: right;
            white-space: nowrap;
          }

          .col-description {
            width: 52%;
          }

          .item-name {
            font-weight: 600;
            color: #334155;
          }

          .item-description {
            margin-top: 3px;
            color: #94a3b8;
            font-size: 11px;
          }

          .empty-state {
            padding: 18px 10px;
            color: #94a3b8;
            text-align: center;
          }

          .content-spacer {
            min-height: 250px;
            border-bottom: 3px solid #475569;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.9fr);
            gap: 28px;
            padding-top: 16px;
            align-items: start;
          }

          .words-text {
            color: #475569;
            font-size: 12px;
            line-height: 1.6;
          }

          .bank-box {
            margin-top: 14px;
            border: 1px solid #dbe3ee;
            border-radius: 8px;
            padding: 14px 16px;
          }

          .bank-grid {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 8px 12px;
            color: #64748b;
            font-size: 12px;
          }

          .bank-grid strong,
          .totals-table strong {
            color: #334155;
          }

          .totals-table td {
            padding: 0 0 10px;
            color: #64748b;
            font-size: 13px;
          }

          .totals-table td:last-child {
            text-align: right;
            white-space: nowrap;
          }

          .grand-total td {
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            color: #111827;
            font-size: 15px;
            font-weight: 700;
          }

          .footer-divider {
            margin: 26px 0 14px;
            border-top: 1px solid #dbe3ee;
          }

          .footer-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 220px;
            gap: 32px;
            align-items: end;
          }

          .terms-list {
            margin: 8px 0 0;
            padding-left: 16px;
            color: #64748b;
            font-size: 12px;
            line-height: 1.65;
          }

          .signature-block {
            text-align: center;
            color: #64748b;
            font-size: 12px;
          }

          .signature-line {
            margin-top: 42px;
            border-top: 1px solid #cbd5e1;
            padding-top: 8px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <main class="invoice-sheet">
          <section class="topbar">
            <div>
              <h1 class="company-name">${escapeHtml(COMPANY_DETAILS.name)}</h1>
              <div class="company-meta">
                <div>${escapeHtml(COMPANY_DETAILS.address)}</div>
                <div>Ph: ${escapeHtml(COMPANY_DETAILS.phone)}</div>
              </div>
            </div>

            <div>
              <h2 class="invoice-title">INVOICE</h2>
              <div class="invoice-meta">
                <div><strong>Invoice No:</strong> ${escapeHtml(invoice.invoice_number)}</div>
                <div><strong>Date:</strong> ${escapeHtml(formatDateForPrint(invoice.issue_date))}</div>
              </div>
            </div>
          </section>

          <div class="section-divider"></div>

          <section class="bill-to">
            <p class="section-label">Billed To:</p>
            <p class="bill-to-name">${escapeHtml(billedToName)}</p>
            <div class="bill-to-address">${escapeHtml(billedToAddress)}</div>
          </section>

          <table class="items-table">
            <thead>
              <tr>
                <th class="col-serial">#</th>
                <th class="col-description">Item Description</th>
                <th class="col-qty">Qty</th>
                <th class="col-rate">Rate (&#8377;)</th>
                <th class="col-amount">Amount (&#8377;)</th>
              </tr>
            </thead>
                <tbody>${itemRows}</tbody>
          </table>

          <div class="content-spacer"></div>

          <section class="summary-grid">
            <div>
              <p class="section-label">Amount In Words:</p>
              <div class="words-text">${escapeHtml(amountInWords)}</div>

              <div class="bank-box">
                <p class="section-label" style="margin-top:0;">Bank Details</p>
                <div class="bank-grid">
                  <strong>Bank Name:</strong>
                  <span>${escapeHtml(COMPANY_DETAILS.bankName)}</span>
                  <strong>Account Number:</strong>
                  <span>${escapeHtml(COMPANY_DETAILS.accountNumber)}</span>
                  <strong>Branch & IFSC:</strong>
                  <span>${escapeHtml(COMPANY_DETAILS.branchAndIfsc)}</span>
                </div>
              </div>
            </div>

            <div>
              <table class="totals-table">
                <tbody>
                      <tr>
                        <td>Taxable Amount</td>
                        <td>${escapeHtml(formatCurrency(taxableAmount))}</td>
                      </tr>
                      <tr class="grand-total">
                        <td>Grand Total</td>
                        <td>${escapeHtml(formatCurrency(grandTotal))}</td>
                      </tr>
                </tbody>
              </table>
            </div>
          </section>

          <div class="footer-divider"></div>

          <section class="footer-grid">
            <div>
              <p class="section-label">Terms & Conditions</p>
              <ol class="terms-list">
                ${TERMS_AND_CONDITIONS.map((term) => `<li>${escapeHtml(term)}</li>`).join('')}
              </ol>
            </div>

            <div class="signature-block">
              <div>For ${escapeHtml(COMPANY_DETAILS.name)}</div>
              <div class="signature-line">Authorised Signatory</div>
            </div>
          </section>
        </main>
      </body>
    </html>
  `;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDateForPrint(dateString) {
  if (!dateString) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-CA').format(new Date(`${dateString}T00:00:00`));
}

function convertNumberToWords(amount) {
  const roundedAmount = Math.round(Number(amount || 0));

  if (roundedAmount === 0) {
    return 'INR Zero Only';
  }

  const units = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertBelowThousand = (value) => {
    let result = '';
    const hundred = Math.floor(value / 100);
    const remainder = value % 100;

    if (hundred) {
      result += `${units[hundred]} Hundred`;
      if (remainder) {
        result += ' ';
      }
    }

    if (remainder < 20) {
      result += units[remainder];
    } else {
      result += tens[Math.floor(remainder / 10)];
      if (remainder % 10) {
        result += ` ${units[remainder % 10]}`;
      }
    }

    return result.trim();
  };

  const parts = [];
  const crore = Math.floor(roundedAmount / 10000000);
  const lakh = Math.floor((roundedAmount % 10000000) / 100000);
  const thousand = Math.floor((roundedAmount % 100000) / 1000);
  const remainder = roundedAmount % 1000;

  if (crore) {
    parts.push(`${convertBelowThousand(crore)} Crore`);
  }

  if (lakh) {
    parts.push(`${convertBelowThousand(lakh)} Lakh`);
  }

  if (thousand) {
    parts.push(`${convertBelowThousand(thousand)} Thousand`);
  }

  if (remainder) {
    parts.push(convertBelowThousand(remainder));
  }

  return `INR ${parts.join(' ')} Only`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
