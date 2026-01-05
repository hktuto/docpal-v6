const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read Excel file
const wb = xlsx.readFile(path.join(__dirname, 'dataset_v5.xlsx'));

// Read all sheets
const salesData = xlsx.utils.sheet_to_json(wb.Sheets['Sales']);
const contactData = xlsx.utils.sheet_to_json(wb.Sheets['Contact']);
const companyData = xlsx.utils.sheet_to_json(wb.Sheets['Company']);
const caseData = xlsx.utils.sheet_to_json(wb.Sheets['Case']);
const quotationData = xlsx.utils.sheet_to_json(wb.Sheets['Quotation']);

// Helper to convert Excel date number to ISO date string
function excelDateToISO(excelDate) {
  if (!excelDate) return null;
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

// Create users map from Sales data
const usersMap = {};
salesData.forEach((row, index) => {
  const userId = `user-${index + 1}`;
  usersMap[row['English Name']] = userId;
  usersMap[row['Salesperson Name']] = userId;
});

// Create companies
const companiesMap = {};
const companyRows = [];
companyData.forEach((row) => {
  const companyId = row['Company ID'];
  if (!companyId || companiesMap[companyId]) return;
  
  const rowId = `row-comp-${companyId.replace('CP', '')}`;
  companiesMap[companyId] = rowId;
  companyRows.push({
    id: rowId,
    name: row['Company Name'],
    email: row['Email'] || '',
    phone: row['Contact Number'] || '',
    address: row['Address'] || '',
    type: 'opt-2', // Default to SMB
    salesPerson: usersMap[row['Salesperson']] || 'user-1',
    contacts: [],
    quotations: [],
    contracts: [],
    isActive: true,
    website: '',
    rating: 4,
    paymentTerms: row['Payment Terms'] || '',
    currency: row['Currency'] || 'HKD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
});

// Create contacts
const contactsMap = {};
const contactRows = [];
let contactIndex = 1;
contactData.forEach((row) => {
  if (!row['Company ID'] || !row['Contact Person']) return;
  const contactKey = `${row['Company ID']}-${row['Contact Person']}`;
  if (contactsMap[contactKey]) return;
  
  const rowId = `row-contact-${String(contactIndex).padStart(3, '0')}`;
  contactsMap[contactKey] = rowId;
  contactsMap[row['Contact Person']] = rowId; // Also map by name
  
  const companyRowId = companiesMap[row['Company ID']];
  
  contactRows.push({
    id: rowId,
    name: row['Contact Person'],
    email: row['Email'] || '',
    phone: row['Contact Number'] || '',
    mobile: row['Mobile Number'] || '',
    company: companyRowId,
    position: row['Job Title'] || '',
    department: row['Department'] || '',
    isPrimary: contactIndex === 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  // Add contact to company
  const companyRow = companyRows.find(c => c.id === companyRowId);
  if (companyRow) {
    companyRow.contacts.push(rowId);
  }
  
  contactIndex++;
});

// Create cases map
const casesMap = {};
caseData.forEach((row) => {
  casesMap[row['Case ID']] = {
    salesperson: row['Salesperson'],
    status: row['Case Status'],
    statusUpdateDate: excelDateToISO(row['Case Status Last Update Date']),
    estimatedValue: row['Estimate Total Contract Value (HKD)'],
    estimatedBookedDate: excelDateToISO(row['Estimate Booked Date']),
    projectName: row['Project Name']
  };
});

// Group quotations by Quotation No.
const quotationsGrouped = {};
quotationData.forEach((row) => {
  const quotNo = row['Quotation No.'];
  if (!quotationsGrouped[quotNo]) {
    quotationsGrouped[quotNo] = {
      caseId: row['Case ID'],
      quotationNo: quotNo,
      totalAmount: row['Total Amount (HKD)'] || 0,
      specialNotes: row['Special Notes'] || '',
      lines: []
    };
  }
  quotationsGrouped[quotNo].lines.push({
    itemNo: row['Item No.'],
    description: row['Description'],
    quantity: row['Quantity'],
    unitPrice: row['Unit Price (HKD)'],
    netPrice: row['Net Price (HKD)']
  });
});

// Create quotation lines
const quotationLineRows = [];
let lineIndex = 1;

// Create quotations
const quotationRows = [];
let quotIndex = 1;

Object.entries(quotationsGrouped).forEach(([quotNo, quotData]) => {
  const quotRowId = `row-quot-${String(quotIndex).padStart(3, '0')}`;
  const caseInfo = casesMap[quotData.caseId] || {};
  
  // Map case status to quotation status
  let statusId = 'status-1'; // Draft
  switch (caseInfo.status) {
    case 'Closed-Won':
      statusId = 'status-3'; // Accepted
      break;
    case 'Closed-Lost':
      statusId = 'status-4'; // Rejected
      break;
    case 'Pipeline':
      statusId = 'status-2'; // Sent
      break;
    case 'Opportunity':
      statusId = 'status-2'; // Sent
      break;
    case 'Lead':
      statusId = 'status-1'; // Draft
      break;
    case 'Disqualify':
      statusId = 'status-4'; // Rejected
      break;
  }
  
  // Find company from case (we'll link to first company for simplicity)
  const companyRowId = companyRows.length > 0 ? companyRows[(quotIndex - 1) % companyRows.length].id : null;
  
  // Create line items for this quotation
  const lineIds = [];
  quotData.lines.forEach((line) => {
    const lineRowId = `row-ql-${String(lineIndex).padStart(3, '0')}`;
    lineIds.push(lineRowId);
    
    quotationLineRows.push({
      id: lineRowId,
      quotation: quotRowId,
      product: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discount: 0,
      tax: 0,
      totalPrice: line.netPrice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    lineIndex++;
  });
  
  // Calculate total from lines
  const totalAmount = quotData.lines.reduce((sum, line) => sum + (line.netPrice || 0), 0);
  
  quotationRows.push({
    id: quotRowId,
    quotationNumber: quotNo,
    caseId: quotData.caseId,
    projectName: caseInfo.projectName || '',
    company: companyRowId,
    contactPerson: contactRows.length > 0 ? contactRows[(quotIndex - 1) % contactRows.length].id : null,
    quotationDate: caseInfo.statusUpdateDate || new Date().toISOString().split('T')[0],
    quotationLines: lineIds,
    salesPerson: usersMap[caseInfo.salesperson] || 'user-1',
    status: statusId,
    validUntil: caseInfo.estimatedBookedDate || null,
    attachments: [],
    notes: quotData.specialNotes,
    estimatedValue: caseInfo.estimatedValue || totalAmount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  // Add quotation to company
  if (companyRowId) {
    const companyRow = companyRows.find(c => c.id === companyRowId);
    if (companyRow) {
      companyRow.quotations.push(quotRowId);
    }
  }
  
  quotIndex++;
});

// Build the final CRM database structure
const crmDatabase = {
  databases: [
    {
      id: "db-crm",
      name: "CRM Database",
      description: "Customer Relationship Management system for managing companies, contacts, quotations, and contracts",
      icon: "briefcase",
      color: "#3b82f6",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: new Date().toISOString(),
      createdBy: {
        id: "user-1",
        name: salesData[0]?.['English Name'] || "Admin",
        email: "admin@company.com"
      },
      dashboards: [
        {
          id: "dash-overview",
          name: "CRM Overview",
          icon: "chart-bar",
          scope: "database",
          widgets: [
            { id: "w1", title: "Total Companies", type: "stat", width: 1, height: 1, config: { aggregation: "count", tableId: "tbl-company" } },
            { id: "w2", title: "Total Contacts", type: "stat", width: 1, height: 1, config: { aggregation: "count", tableId: "tbl-contact" } },
            { id: "w3", title: "Open Quotations", type: "stat", width: 1, height: 1, config: { aggregation: "count", tableId: "tbl-quotation" } },
            { id: "w4", title: "Active Contracts", type: "stat", width: 1, height: 1, config: { aggregation: "count", tableId: "tbl-contract" } },
            { id: "w5", title: "Companies by Type", type: "chart-pie", width: 2, height: 2, config: { tableId: "tbl-company", groupByField: "type" } },
            { id: "w6", title: "Quotations by Status", type: "chart-bar", width: 2, height: 2, config: { tableId: "tbl-quotation", groupByField: "status" } }
          ]
        }
      ],
      navigation: [
        {
          id: "nav-overview",
          type: "dashboard",
          label: "CRM Overview",
          icon: "data-analysis",
          targetId: "dash-overview"
        },
        {
          id: "nav-company-mgmt",
          type: "folder",
          label: "Company Management",
          description: "Centralize all your company and contact information in one place.",
          icon: "office-building",
          isExpanded: true,
          children: [
            { id: "nav-companies", type: "table", label: "Companies", icon: "suitcase", targetId: "tbl-company" },
            { id: "nav-contacts", type: "table", label: "Contacts", icon: "user", targetId: "tbl-contact" }
          ]
        },
        {
          id: "nav-sales-mgmt",
          type: "folder",
          label: "Sales Management",
          description: "Monitor your entire sales pipeline from initial quotation to deal closure.",
          icon: "money",
          isExpanded: true,
          children: [
            { id: "nav-quotations", type: "table", label: "Quotations", icon: "document", targetId: "tbl-quotation" },
            { id: "nav-quot-lines", type: "table", label: "Quotation Lines", icon: "document-copy", targetId: "tbl-quotation-line" }
          ]
        },
        {
          id: "nav-contract-mgmt",
          type: "folder",
          label: "Contracts",
          description: "Manage all your contracts in one centralized location.",
          icon: "tickets",
          children: [
            { id: "nav-contracts", type: "table", label: "All Contracts", icon: "document-checked", targetId: "tbl-contract" },
            { id: "nav-contract-lines", type: "table", label: "Contract Lines", icon: "document-copy", targetId: "tbl-contract-line" }
          ]
        }
      ],
      tables: [
        {
          id: "tbl-company",
          name: "Companies",
          icon: "building",
          views: [
            { id: "view-company-table", name: "All Companies", type: "table", isDefault: true },
            { id: "view-company-kanban", name: "By Type", type: "kanban", config: { groupByField: "type" } }
          ],
          columns: [
            { id: "col-1", field: "name", title: "Name", type: "text", width: 200, required: true },
            { id: "col-2", field: "email", title: "Email", type: "email", width: 200 },
            { id: "col-3", field: "phone", title: "Phone", type: "text", width: 150 },
            { id: "col-4", field: "address", title: "Address", type: "textarea", width: 250 },
            { id: "col-5", field: "type", title: "Type", type: "single-select", width: 120, options: [
              { id: "opt-1", label: "Enterprise", color: "#8b5cf6" },
              { id: "opt-2", label: "SMB", color: "#3b82f6" },
              { id: "opt-3", label: "Startup", color: "#10b981" },
              { id: "opt-4", label: "Government", color: "#f59e0b" }
            ]},
            { id: "col-6", field: "salesPerson", title: "Sales Person", type: "user", width: 150 },
            { id: "col-7", field: "contacts", title: "Contacts", type: "relation", width: 200, relationConfig: { tableId: "tbl-contact", displayField: "name", multiple: true }},
            { id: "col-8", field: "quotations", title: "Quotations", type: "relation", width: 200, relationConfig: { tableId: "tbl-quotation", displayField: "quotationNumber", multiple: true }},
            { id: "col-9", field: "contracts", title: "Contracts", type: "relation", width: 200, relationConfig: { tableId: "tbl-contract", displayField: "contractNumber", multiple: true }},
            { id: "col-10", field: "isActive", title: "Active", type: "switch", width: 80 },
            { id: "col-11", field: "paymentTerms", title: "Payment Terms", type: "text", width: 120 },
            { id: "col-12", field: "currency", title: "Currency", type: "text", width: 80 },
            { id: "col-13", field: "rating", title: "Rating", type: "rating", width: 120, maxRating: 5 }
          ],
          rows: companyRows
        },
        {
          id: "tbl-contact",
          name: "Contacts",
          icon: "user",
          views: [
            { id: "view-contact-table", name: "All Contacts", type: "table", isDefault: true },
            { id: "view-contact-gallery", name: "Gallery", type: "gallery", config: { titleField: "name" } }
          ],
          columns: [
            { id: "col-1", field: "name", title: "Name", type: "text", width: 180, required: true },
            { id: "col-2", field: "email", title: "Email", type: "email", width: 220 },
            { id: "col-3", field: "phone", title: "Phone", type: "text", width: 150 },
            { id: "col-4", field: "mobile", title: "Mobile", type: "text", width: 150 },
            { id: "col-5", field: "company", title: "Company", type: "relation", width: 180, relationConfig: { tableId: "tbl-company", displayField: "name", multiple: false }},
            { id: "col-6", field: "position", title: "Position", type: "text", width: 150 },
            { id: "col-7", field: "department", title: "Department", type: "text", width: 150 },
            { id: "col-8", field: "isPrimary", title: "Primary Contact", type: "checkbox", width: 120 }
          ],
          rows: contactRows
        },
        {
          id: "tbl-quotation",
          name: "Quotations",
          icon: "file-text",
          views: [
            { id: "view-quot-table", name: "All Quotations", type: "table", isDefault: true },
            { id: "view-quot-kanban", name: "By Status", type: "kanban", config: { groupByField: "status" } },
            { id: "view-quot-calendar", name: "Calendar", type: "calendar", config: { dateField: "quotationDate" } }
          ],
          columns: [
            { id: "col-1", field: "quotationNumber", title: "Quotation #", type: "text", width: 140, required: true },
            { id: "col-2", field: "caseId", title: "Case ID", type: "text", width: 120 },
            { id: "col-3", field: "projectName", title: "Project Name", type: "text", width: 250 },
            { id: "col-4", field: "company", title: "Company", type: "relation", width: 180, relationConfig: { tableId: "tbl-company", displayField: "name", multiple: false }},
            { id: "col-5", field: "contactPerson", title: "Contact Person", type: "relation", width: 160, relationConfig: { tableId: "tbl-contact", displayField: "name", multiple: false }},
            { id: "col-6", field: "quotationDate", title: "Date", type: "date", width: 120, dateFormat: "YYYY-MM-DD" },
            { id: "col-7", field: "quotationLines", title: "Lines", type: "relation", width: 200, relationConfig: { tableId: "tbl-quotation-line", displayField: "product", multiple: true }},
            { id: "col-8", field: "estimatedValue", title: "Estimated Value", type: "number", width: 140, decimalPlaces: 2 },
            { id: "col-9", field: "salesPerson", title: "Sales Person", type: "user", width: 150 },
            { id: "col-10", field: "status", title: "Status", type: "single-select", width: 130, options: [
              { id: "status-1", label: "Draft", color: "#6b7280" },
              { id: "status-2", label: "Sent", color: "#3b82f6" },
              { id: "status-3", label: "Accepted", color: "#10b981" },
              { id: "status-4", label: "Rejected", color: "#ef4444" },
              { id: "status-5", label: "Expired", color: "#f59e0b" }
            ]},
            { id: "col-11", field: "validUntil", title: "Valid Until", type: "date", width: 120 },
            { id: "col-12", field: "attachments", title: "Attachments", type: "attachment", width: 150 },
            { id: "col-13", field: "notes", title: "Notes", type: "textarea", width: 200 }
          ],
          rows: quotationRows
        },
        {
          id: "tbl-quotation-line",
          name: "Quotation Lines",
          icon: "list",
          views: [
            { id: "view-ql-table", name: "All Lines", type: "table", isDefault: true }
          ],
          columns: [
            { id: "col-1", field: "quotation", title: "Quotation", type: "relation", width: 140, relationConfig: { tableId: "tbl-quotation", displayField: "quotationNumber", multiple: false }},
            { id: "col-2", field: "product", title: "Product/Description", type: "text", width: 300, required: true },
            { id: "col-3", field: "quantity", title: "Quantity", type: "number", width: 100 },
            { id: "col-4", field: "unitPrice", title: "Unit Price (HKD)", type: "number", width: 140, decimalPlaces: 2 },
            { id: "col-5", field: "discount", title: "Discount %", type: "number", width: 100, decimalPlaces: 1 },
            { id: "col-6", field: "tax", title: "Tax %", type: "number", width: 80, decimalPlaces: 1 },
            { id: "col-7", field: "totalPrice", title: "Net Price (HKD)", type: "number", width: 140, decimalPlaces: 2 }
          ],
          rows: quotationLineRows
        },
        {
          id: "tbl-contract",
          name: "Contracts",
          icon: "file-signature",
          views: [
            { id: "view-contract-table", name: "All Contracts", type: "table", isDefault: true },
            { id: "view-contract-kanban", name: "By Status", type: "kanban", config: { groupByField: "status" } }
          ],
          columns: [
            { id: "col-1", field: "contractNumber", title: "Contract #", type: "text", width: 140, required: true },
            { id: "col-2", field: "company", title: "Company", type: "relation", width: 180, relationConfig: { tableId: "tbl-company", displayField: "name", multiple: false }},
            { id: "col-3", field: "quotation", title: "Quotation", type: "relation", width: 140, relationConfig: { tableId: "tbl-quotation", displayField: "quotationNumber", multiple: false }},
            { id: "col-4", field: "contractDate", title: "Date", type: "date", width: 120, dateFormat: "YYYY-MM-DD" },
            { id: "col-5", field: "contractLines", title: "Lines", type: "relation", width: 200, relationConfig: { tableId: "tbl-contract-line", displayField: "product", multiple: true }},
            { id: "col-6", field: "totalAmount", title: "Total Amount", type: "number", width: 140, decimalPlaces: 2 },
            { id: "col-7", field: "salesPerson", title: "Sales Person", type: "user", width: 150 },
            { id: "col-8", field: "status", title: "Status", type: "single-select", width: 130, options: [
              { id: "cstatus-1", label: "Draft", color: "#6b7280" },
              { id: "cstatus-2", label: "Pending Signature", color: "#f59e0b" },
              { id: "cstatus-3", label: "Active", color: "#10b981" },
              { id: "cstatus-4", label: "Completed", color: "#3b82f6" },
              { id: "cstatus-5", label: "Cancelled", color: "#ef4444" }
            ]},
            { id: "col-9", field: "startDate", title: "Start Date", type: "date", width: 120 },
            { id: "col-10", field: "endDate", title: "End Date", type: "date", width: 120 },
            { id: "col-11", field: "attachments", title: "Attachments", type: "attachment", width: 150 }
          ],
          rows: []
        },
        {
          id: "tbl-contract-line",
          name: "Contract Lines",
          icon: "list",
          views: [
            { id: "view-cl-table", name: "All Lines", type: "table", isDefault: true }
          ],
          columns: [
            { id: "col-1", field: "contract", title: "Contract", type: "relation", width: 140, relationConfig: { tableId: "tbl-contract", displayField: "contractNumber", multiple: false }},
            { id: "col-2", field: "product", title: "Product", type: "text", width: 200, required: true },
            { id: "col-3", field: "quantity", title: "Quantity", type: "number", width: 100 },
            { id: "col-4", field: "unitPrice", title: "Unit Price", type: "number", width: 120, decimalPlaces: 2 },
            { id: "col-5", field: "discount", title: "Discount %", type: "number", width: 100, decimalPlaces: 1 },
            { id: "col-6", field: "tax", title: "Tax %", type: "number", width: 80, decimalPlaces: 1 },
            { id: "col-7", field: "totalPrice", title: "Total Price", type: "number", width: 130 }
          ],
          rows: []
        }
      ]
    }
  ]
};

// Write to JSON file
const outputPath = path.join(__dirname, 'crm-database.json');
fs.writeFileSync(outputPath, JSON.stringify(crmDatabase, null, 2));

console.log('Conversion completed!');
console.log(`Companies: ${companyRows.length}`);
console.log(`Contacts: ${contactRows.length}`);
console.log(`Quotations: ${quotationRows.length}`);
console.log(`Quotation Lines: ${quotationLineRows.length}`);
console.log(`Output written to: ${outputPath}`);

