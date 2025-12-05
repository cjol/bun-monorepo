import type { DB } from "../../db";
import type { NewDocumentTemplate } from "@ai-starter/core/schema/documentTemplate";
import { documentTemplateSchema } from "@ai-starter/core/schema";
import { mockMatters } from "./matter";

export const timeEntrySpreadsheetTemplate: NewDocumentTemplate = {
  name: "Time Entry Spreadsheet",
  matterId: mockMatters[0].id,
  description: "CSV export of time entries for a matter",
  outputFormat: "csv",
  dataSchema: JSON.stringify({
    type: "object",
    properties: {
      timeEntries: {
        type: "array",
        items: {
          type: "object",
          properties: {
            date: { type: "string" },
            timekeeperName: { type: "string" },
            description: { type: "string" },
            hours: { type: "number" },
            billName: { type: "string" },
          },
        },
      },
    },
  }),
  templateCode: `
    const headers = ["Date", "Timekeeper", "Description", "Hours", "Bill"];
    const rows = data.timeEntries.map(entry => [
      entry.date,
      entry.timekeeperName,
      entry.description,
      entry.hours,
      entry.billName || "",
    ]);

    return csvContent(headers, rows);
  `,
};

export const matterSummaryReportTemplate: NewDocumentTemplate = {
  name: "Matter Summary Report",
  matterId: mockMatters[0].id,
  description: "HTML report summarizing matter information and time entries",
  outputFormat: "html",
  dataSchema: JSON.stringify({
    type: "object",
    properties: {
      matter: {
        type: "object",
        properties: {
          clientName: { type: "string" },
          matterName: { type: "string" },
          description: { type: "string" },
        },
      },
      timeEntries: {
        type: "array",
        items: {
          type: "object",
          properties: {
            date: { type: "string" },
            timekeeperName: { type: "string" },
            description: { type: "string" },
            hours: { type: "number" },
          },
        },
      },
      totalHours: { type: "number" },
    },
  }),
  templateCode: `
    const totalHours = data.timeEntries.reduce((sum, entry) => sum + entry.hours, 0);

    return \`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Matter Summary: \${data.matter.matterName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { border-bottom:2px solid #333; padding-bottom:20px; margin-bottom: 30px; }
          .summary { display: flex; gap: 30px; margin-bottom: 30px; }
          .summary-item h3 { margin: 0 0 10px 0; color: #666; }
          .summary-item p { font-size: 24px; font-weight: bold; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Matter Summary</h1>
          <h2>\${data.matter.clientName} - \${data.matter.matterName}</h2>
          <p>\${data.matter.description || ""}</p>
        </div>

        <div class="summary">
          <div class="summary-item">
            <h3>Total Hours</h3>
            <p>\${totalHours.toFixed(1)}</p>
          </div>
          <div class="summary-item">
            <h3>Total Entries</h3>
            <p>\${data.timeEntries.length}</p>
          </div>
        </div>

        <h3>Time Entries</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Timekeeper</th>
              <th>Description</th>
              <th>Hours</th>
            </tr>
          </thead>
          <tbody>
            \${data.timeEntries.map(entry => \`
              <tr>
                <td>\${formatDate(entry.date, "short")}</td>
                <td>\${entry.timekeeperName}</td>
                <td>\${entry.description}</td>
                <td>\${entry.hours}</td>
              </tr>
            \`).join("")}
          </tbody>
        </table>
      </body>
      </html>
    \`;
  `,
};

export const invoiceTemplate: NewDocumentTemplate = {
  name: "Invoice",
  matterId: mockMatters[0].id,
  description: "HTML invoice for a bill",
  outputFormat: "html",
  dataSchema: JSON.stringify({
    type: "object",
    properties: {
      bill: {
        type: "object",
        properties: {
          id: { type: "string" },
          periodStart: { type: "string" },
          periodEnd: { type: "string" },
          status: { type: "string" },
        },
      },
      matter: {
        type: "object",
        properties: {
          clientName: { type: "string" },
          matterName: { type: "string" },
        },
      },
      timeEntries: {
        type: "array",
        items: {
          type: "object",
          properties: {
            date: { type: "string" },
            description: { type: "string" },
            hours: { type: "number" },
            hourlyRate: { type: "number" },
          },
        },
      },
    },
  }),
  templateCode: `
    const subtotal = data.timeEntries.reduce((sum, entry) => sum + (entry.hours * entry.hourlyRate), 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    return \`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice: \${data.bill.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 40px; }
          .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .total { text-align: right; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <h2>#\${data.bill.id}</h2>
        </div>

        <div class="invoice-details">
          <div>
            <strong>Bill To:</strong><br>
            \${data.matter.clientName}<br>
            \${data.matter.matterName}
          </div>
          <div>
            <strong>Period:</strong><br>
            \${formatDate(data.bill.periodStart)} to \${formatDate(data.bill.periodEnd)}
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Hours</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            \${data.timeEntries.map(entry => \`
              <tr>
                <td>\${formatDate(entry.date, "short")}</td>
                <td>\${entry.description}</td>
                <td>\${entry.hours}</td>
                <td>\${formatCurrency(entry.hourlyRate)}</td>
                <td>\${formatCurrency(entry.hours * entry.hourlyRate)}</td>
              </tr>
            \`).join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4">Subtotal</td>
              <td>\${formatCurrency(subtotal)}</td>
            </tr>
            <tr>
              <td colspan="4">Tax (10%)</td>
              <td>\${formatCurrency(tax)}</td>
            </tr>
            <tr class="total">
              <td colspan="4">Total</td>
              <td>\${formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Payment due within 30 days</p>
        </div>
      </body>
      </html>
    \`;
  `,
};

export async function doSeedDocumentTemplates(db: DB) {
  // Insert document templates
  await db
    .insert(documentTemplateSchema)
    .values([
      timeEntrySpreadsheetTemplate,
      matterSummaryReportTemplate,
      invoiceTemplate,
    ]);
}
