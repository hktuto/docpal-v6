const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read Excel file
const wb = xlsx.readFile(path.join(__dirname, 'dataset_v6.xlsx'));

// Read all sheets
const salesData = xlsx.utils.sheet_to_json(wb.Sheets['Sales']);
const contactData = xlsx.utils.sheet_to_json(wb.Sheets['Contact']);
const companyData = xlsx.utils.sheet_to_json(wb.Sheets['Company']);
const caseData = xlsx.utils.sheet_to_json(wb.Sheets['Case']);
const quotationData = xlsx.utils.sheet_to_json(wb.Sheets['Quotation']);
const quotationLineData = xlsx.utils.sheet_to_json(wb.Sheets['Quotation Lines']);
const contractData = xlsx.utils.sheet_to_json(wb.Sheets['Contract']);
const contractLineData = xlsx.utils.sheet_to_json(wb.Sheets['Contract Lines']);

// Email domain
const EMAIL_DOMAIN = 'docpal.com';

// Helper to convert Excel date number to ISO date string
function excelDateToISO(excelDate) {
  if (!excelDate || typeof excelDate !== 'number') return null;
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

// ============================================
// 1. Generate Sales Users
// ============================================
const usersMap = {}; // name -> user id
const users = salesData
  .filter(row => row['id'] && row['name'])
  .map((row) => {
    const id = row['id'];
    const name = row['name'];
    const role = row['role'] || 'Sales Representative';
    
    // Map name to user id for relations
    usersMap[name] = id;
    
    const nameParts = name.toLowerCase().split(' ');
    const email = nameParts.length >= 2 
      ? `${nameParts[0]}.${nameParts[nameParts.length - 1]}@${EMAIL_DOMAIN}`
      : `${nameParts[0]}@${EMAIL_DOMAIN}`;
    
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s+/g, '')}`;
    
    return { id, name, email, avatar, role };
  });

// Write sales-users.json
fs.writeFileSync(
  path.join(__dirname, 'sales-users-new.json'),
  JSON.stringify({ users }, null, 2)
);
console.log(`✓ sales-users.json: ${users.length} users`);

// ============================================
// 2. Build ID Maps for Relations
// ============================================

// Company map: Company ID -> row id
const companyIdMap = {};
companyData.forEach((row, i) => {
  if (row['Company ID']) {
    companyIdMap[row['Company ID']] = `row-company-${String(i + 1).padStart(3, '0')}`;
  }
});

// Case map: Case ID -> row id
const caseIdMap = {};
caseData.forEach((row, i) => {
  if (row['Case ID']) {
    caseIdMap[row['Case ID']] = `row-case-${String(i + 1).padStart(3, '0')}`;
  }
});

// Quotation map: Quotation No. -> row id
const quotationIdMap = {};
quotationData.forEach((row, i) => {
  if (row['Quotation No.']) {
    quotationIdMap[row['Quotation No.']] = `row-quotation-${String(i + 1).padStart(3, '0')}`;
  }
});

// Contract map: Contract No. -> row id
const contractIdMap = {};
contractData.forEach((row, i) => {
  if (row['Contract No.']) {
    contractIdMap[row['Contract No.']] = `row-contract-${String(i + 1).padStart(3, '0')}`;
  }
});

// ============================================
// 3. Build Reverse Relations
// ============================================

// Company -> Contacts (1-to-many)
const companyContactsMap = {}; // Company ID -> [contact row ids]
contactData.forEach((row, i) => {
  const companyId = row['Company ID'];
  if (companyId) {
    if (!companyContactsMap[companyId]) companyContactsMap[companyId] = [];
    companyContactsMap[companyId].push(`row-contact-${String(i + 1).padStart(3, '0')}`);
  }
});

// Case -> Quotations (1-to-many)
const caseQuotationsMap = {}; // Case ID -> [quotation row ids]
quotationData.forEach((row) => {
  const caseId = row['Case ID'];
  const quotNo = row['Quotation No.'];
  if (caseId && quotNo) {
    if (!caseQuotationsMap[caseId]) caseQuotationsMap[caseId] = [];
    caseQuotationsMap[caseId].push(quotationIdMap[quotNo]);
  }
});

// Case -> Contracts (1-to-many)
const caseContractsMap = {}; // Case ID -> [contract row ids]
contractData.forEach((row) => {
  const caseId = row['Case ID'];
  const contractNo = row['Contract No.'];
  if (caseId && contractNo) {
    if (!caseContractsMap[caseId]) caseContractsMap[caseId] = [];
    caseContractsMap[caseId].push(contractIdMap[contractNo]);
  }
});

// Quotation -> Quotation Lines (1-to-many)
const quotationLinesMap = {}; // Quotation No. -> [line row ids]
quotationLineData.forEach((row, i) => {
  const quotNo = row['Quotation No.'];
  if (quotNo) {
    if (!quotationLinesMap[quotNo]) quotationLinesMap[quotNo] = [];
    quotationLinesMap[quotNo].push(`row-quotation-line-${String(i + 1).padStart(3, '0')}`);
  }
});

// Quotation -> Total Amount (rollup)
const quotationTotalMap = {}; // Quotation No. -> total
quotationLineData.forEach((row) => {
  const quotNo = row['Quotation No.'];
  const netPrice = row['Net Price (HKD)'] || 0;
  if (quotNo) {
    quotationTotalMap[quotNo] = (quotationTotalMap[quotNo] || 0) + netPrice;
  }
});

// Contract -> Contract Lines (1-to-many)
const contractLinesMap = {}; // Contract No. -> [line row ids]
contractLineData.forEach((row, i) => {
  const contractNo = row['Contract No.'];
  if (contractNo) {
    if (!contractLinesMap[contractNo]) contractLinesMap[contractNo] = [];
    contractLinesMap[contractNo].push(`row-contract-line-${String(i + 1).padStart(3, '0')}`);
  }
});

// Contract -> Total Amount (rollup)
const contractTotalMap = {}; // Contract No. -> total
contractLineData.forEach((row) => {
  const contractNo = row['Contract No.'];
  const netPrice = row['Net Price (HKD)'] || 0;
  if (contractNo) {
    contractTotalMap[contractNo] = (contractTotalMap[contractNo] || 0) + netPrice;
  }
});

// ============================================
// 4. Generate Table Rows
// ============================================

// Company rows
const companyRows = companyData.filter(it => it['Company Name']).map((row, i) => {
  const id = `row-company-${String(i + 1).padStart(3, '0')}`;
  const relatedSalesperson = users.find(user => user.id === row['Salesperson'] || user.name === row['Salesperson']);
  return {
    id,
    companyId: row['Company ID'],
    companyName: row['Company Name'],
    salesperson: relatedSalesperson ? relatedSalesperson.id : null,
    address: row['Address'] || '',
    paymentTerms: row['Payment Terms'] || '',
    currency: row['Currency'] || 'HKD',
    contacts: companyContactsMap[row['Company ID']] || []
  };
});

// Contact rows
const contactRows = contactData.map((row, i) => {
  const id = `row-contact-${String(i + 1).padStart(3, '0')}`;
  return {
    id,
    companyId: companyIdMap[row['Company ID']] || null,
    companyName: row['Company Name'],
    contactPerson: row['Contact Person'],
    department: row['Department'] || '',
    jobTitle: row['Job Title'] || '',
    contactNumber: row['Contact Number'] || '',
    mobileNumber: row['Mobile Number'] || '',
    email: row['Email'] || ''
  };
});

// Case Status options
const caseStatusOptions = [
  { id: 'status-lead', label: 'Lead', color: '#6b7280' },
  { id: 'status-opportunity', label: 'Opportunity', color: '#3b82f6' },
  { id: 'status-pipeline', label: 'Pipeline', color: '#8b5cf6' },
  { id: 'status-closed-won', label: 'Closed-Won', color: '#10b981' },
  { id: 'status-closed-lost', label: 'Closed-Lost', color: '#ef4444' },
  { id: 'status-disqualify', label: 'Disqualify', color: '#f59e0b' }
];
const caseStatusMap = {
  'Lead': 'status-lead',
  'Opportunity': 'status-opportunity',
  'Pipeline': 'status-pipeline',
  'Closed-Won': 'status-closed-won',
  'Closed-Lost': 'status-closed-lost',
  'Disqualify': 'status-disqualify'
};



// Case rows
const caseRows = caseData.map((row, i) => {
  const id = `row-case-${String(i + 1).padStart(3, '0')}`;
  const relatedSalesperson = users.find(user => user.id === row['Salesperson'] || user.name === row['Salesperson']);
  const relatedCompany = companyRows.find(company => company['companyName'] === row['Company Name']);

  return {
    id,
    caseId: row['Case ID'],
    company: relatedCompany.id || null,
    salesperson: relatedSalesperson ? relatedSalesperson.id : null,
    caseStatus: caseStatusMap[row['Case Status']] || null,
    caseStatusLastUpdateDate: excelDateToISO(row['Case Status Last Update Date']),
    caseStatusDuration: row['Case Status Duration (Days)'] || 0,
    estimateTotalContractValue: row['Estimate Total Contract Value (HKD)'] || 0,
    estimateBookedDate: excelDateToISO(row['Estimate Booked Date']),
    projectName: row['Project Name'] || '',
    quotations: caseQuotationsMap[row['Case ID']] || [],
    contracts: caseContractsMap[row['Case ID']] || []
  };
});

companyRows.forEach((company) => {
  company.caseId = caseRows.filter((c) => c.company === company.id).map((c) => c.id);
});

// Quotation rows
const quotationRows = quotationData.map((row, i) => {
  const id = `row-quotation-${String(i + 1).padStart(3, '0')}`;
  const quotNo = row['Quotation No.'];
  const relatedSalesperson = users.find(user => user.id === row['Sales Person'] || user.name === row['Sales Person']);
  const relatedCase = caseRows.find((c) => c.caseId === row['Case ID']);

  return {
    id,
    caseId: caseIdMap[row['Case ID']] || null,
    companyId: relatedCase.company || null,
    quotationNo: quotNo,
    salesperson: relatedSalesperson ? relatedSalesperson.id : null,
    specialNotes: row['Special Notes'] || '',
    lineItems: quotationLinesMap[quotNo] || [],
    totalAmount: quotationTotalMap[quotNo] || 0
  };
});

// Quotation Line rows
const quotationLineRows = quotationLineData.map((row, i) => {
  const id = `row-quotation-line-${String(i + 1).padStart(3, '0')}`;
  const qty = row['Quantity'] || 0;
  const unitPrice = row['Unit Price (HKD)'] || 0;
  return {
    id,
    caseId: caseIdMap[row['Case ID']] || null,
    quotationId: quotationIdMap[row['Quotation No.']] || null,
    itemNo: row['Item No.'] || 0,
    description: row['Description'] || '',
    quantity: qty,
    unitPrice: unitPrice,
    netAmount: qty * unitPrice // formula: qty * unitPrice
  };
});

// Contract rows
const contractRows = contractData.map((row, i) => {
  const id = `row-contract-${String(i + 1).padStart(3, '0')}`;
  const contractNo = row['Contract No.'];
  const relatedSalesperson = users.find(user => user.id === row['Sales Person'] || user.name === row['Sales Person']);

  const relatedCase = caseRows.find((c) => c.caseId === row['Case ID']);

  
  return {
    id,
    caseId: caseIdMap[row['Case ID']] || null,
    contractNo: contractNo,
    companyId: relatedCase.company || null,
    contractStartDate: excelDateToISO(row['Contract Start Date']),
    contractExpiryDate: excelDateToISO(row['Contract Expiry Date']),
    quotationId: quotationIdMap[row['Quotation No.']] || null,
    salesperson: relatedSalesperson ? relatedSalesperson.id : null,
    specialNotes: row['Special Notes'] || '',
    lineItems: contractLinesMap[contractNo] || [],
    totalAmount: contractTotalMap[contractNo] || 0
  };
});

// Contract Line rows
const contractLineRows = contractLineData.map((row, i) => {
  const id = `row-contract-line-${String(i + 1).padStart(3, '0')}`;
  const qty = row['Quantity'] || 0;
  const unitPrice = row['Unit Price (HKD)'] || 0;
  return {
    id,
    caseId: caseIdMap[row['Case ID']] || null,
    contractId: contractIdMap[row['Contract No.']] || null,
    itemNo: row['Item No.'] || 0,
    description: row['Description'] || '',
    quantity: qty,
    unitPrice: unitPrice,
    netAmount: qty * unitPrice // formula: qty * unitPrice
  };
});

// ============================================
// 5. Build CRM Database Structure
// ============================================

const crmDatabase = {
  databases: [
    {
      id: "db-crm",
      name: "CRM Database",
      description: "Customer Relationship Management system",
      icon: "briefcase",
      color: "#3b82f6",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      "createdBy": {
        "id": "user-5",
        "name": "Emma Zhang",
        "email": "emma.zhang@company.com"
      },
     "dashboards": [
        {
          "id": "dash-overview",
          "name": "CRM Overview",
          "icon": "chart-bar",
          "scope": "database",
          "widgets": [
            {
              "id": "w1",
              "title": "Total Companies",
              "type": "stat",
              "width": 1,
              "height": 1,
              "config": {
                "aggregation": "count",
                "tableId": "tbl-company"
              }
            },
            {
              "id": "w2",
              "title": "Total Contacts",
              "type": "stat",
              "width": 1,
              "height": 1,
              "config": {
                "aggregation": "count",
                "tableId": "tbl-contact"
              }
            },
            {
              "id": "w3",
              "title": "Open Quotations",
              "type": "stat",
              "width": 1,
              "height": 1,
              "config": {
                "aggregation": "count",
                "tableId": "tbl-quotation"
              }
            },
            {
              "id": "w4",
              "title": "Active Contracts",
              "type": "stat",
              "width": 1,
              "height": 1,
              "config": {
                "aggregation": "count",
                "tableId": "tbl-contract"
              }
            },
            {
              "id": "w5",
              "title": "Companies by Type",
              "type": "chart-pie",
              "width": 2,
              "height": 2,
              "config": {
                "tableId": "tbl-company",
                "groupByField": "type"
              }
            },
            {
              "id": "w6",
              "title": "Quotations by Status",
              "type": "chart-bar",
              "width": 2,
              "height": 2,
              "config": {
                "tableId": "tbl-quotation",
                "groupByField": "status"
              }
            }
          ]
        }
      ],
      "navigation": [
        {
          "id": "nav-company-mgmt",
          "type": "folder",
          "label": "Company Management",
          "description": "Centralize all your company and contact information in one place. Track company details, maintain contact records, and manage organizational relationships efficiently. This section provides a comprehensive view of your customer and partner network.",
          "icon": "office-building",
          "isExpanded": true,
          "children": [
            {
              "id": "nav-overview",
              "type": "dashboard",
              "label": "CRM Overview",
              "icon": "data-analysis",
              "targetId": "dash-overview"
            },
            {
              "id": "nav-cases",
              "type": "table",
              "label": "Cases",
              "icon": "suitcase",
              "targetId": "tbl-case"
            },
            {
              "id": "nav-companies",
              "type": "table",
              "label": "Company List",
              "icon": "suitcase",
              "targetId": "tbl-company"
            },
            {
              "id": "nav-contacts",
              "type": "table",
              "label": "Contacts",
              "icon": "user",
              "targetId": "tbl-contact"
            }
          ]
        },
        {
          "id": "nav-sales-mgmt",
          "type": "folder",
          "label": "Sales Management",
          "description": "Monitor your entire sales pipeline from initial quotation to deal closure. Track quotation details, line items, deal values, and sales performance metrics. Use custom views to focus on high-value opportunities and manage your personal sales pipeline effectively.",
          "icon": "money",
          "isExpanded": true,
          "children": [
            {
              "id": "nav-quotations",
              "type": "table",
              "label": "Quotations",
              "icon": "document",
              "targetId": "tbl-quotation"
            },
            {
              "id": "nav-quot-lines",
              "type": "table",
              "label": "Quotation Lines",
              "icon": "document-copy",
              "targetId": "tbl-quotation-line"
            },
            {
              "id": "nav-high-value",
              "type": "view",
              "label": "Group By Salesperson",
              "icon": "trophy",
              "targetId": "view-1767331914439-qv6phnwef",
              "targetTableId": "tbl-quotation"
            }
          ]
        },
        {
          "id": "nav-contract-mgmt",
          "type": "folder",
          "label": "Contracts Management",
          "description": "Manage all your contracts and contract terms in one centralized location. Track contract status, monitor active agreements, review contract lines, and stay on top of renewal dates. Quickly access views for active contracts requiring your attention.",
          "icon": "tickets",
          "isExpanded": true,
          "children": [
            {
              "id": "nav-contracts",
              "type": "table",
              "label": "All Contracts",
              "icon": "document-checked",
              "targetId": "tbl-contract"
            },
            {
              "id": "nav-contract-lines",
              "type": "table",
              "label": "Contract Lines",
              "icon": "document-copy",
              "targetId": "tbl-contract-line"
            }
          ]
        }
      ],
      tables: [
        // Company Table
        {
          id: "tbl-company",
          name: "Companies",
          icon: "office-building",
          "views": [
            {
              "id": "view-company-table",
              "name": "Company List",
              "type": "table",
              "isDefault": true
            },
            {
              "id": "view-company-kanban",
              "name": "By Type",
              "type": "kanban",
              "config": {
                "groupByField": "salesperson"
              }
            }
          ],
          "columns": [
            {
              "id": "col-1",
              "field": "companyId",
              "title": "Company ID",
              "type": "text",
              "width": 120,
              "required": true
            },
            {
              "id": "col-1-1",
              "field": "caseId",
              "title": "Case",
              "type": "relation",
              "width": 120,
              "relationConfig": {
                "tableId": "tbl-case",
                "displayField": "caseId",
                "multiple": true
              }
            },
            {
              "id": "col-2",
              "field": "companyName",
              "title": "Company Name",
              "type": "text",
              "width": 250,
              "required": true
            },
            {
              "id": "col-3",
              "field": "salesperson",
              "title": "Salesperson",
              "type": "user",
              "width": 150,
              "relationConfig": {
                "tableId": "tbl-sales",
                "displayField": "name",
                "multiple": false
              }
            },
            {
              "id": "col-4",
              "field": "address",
              "title": "Address",
              "type": "textarea",
              "width": 300
            },
            {
              "id": "col-5",
              "field": "paymentTerms",
              "title": "Payment Terms",
              "type": "text",
              "width": 120
            },
            {
              "id": "col-6",
              "field": "currency",
              "title": "Currency",
              "type": "text",
              "width": 80
            },
            {
              "id": "col-7",
              "field": "contacts",
              "title": "Contact Person",
              "type": "relation",
              "width": 200,
              "relationConfig": {
                "tableId": "tbl-contact",
                "displayField": "contactPerson",
                "multiple": true
              }
            }
          ],
          rows: companyRows
        },
        // Contact Table
        {
          id: "tbl-contact",
          name: "Contacts",
          icon: "user",
          "views": [
            {
              "id": "view-company-table",
              "name": "All Companies",
              "type": "table",
              "isDefault": true
            },
            {
              "id": "view-company-kanban",
              "name": "By Type",
              "type": "kanban",
              "config": {
                "groupByField": "companyId"
              }
            }
          ],
          "columns": [
            {
              "id": "col-1",
              "field": "companyId",
              "title": "Company",
              "type": "relation",
              "width": 200,
              "relationConfig": {
                "tableId": "tbl-company",
                "displayField": "companyName",
                "multiple": false
              }
            },
            {
              "id": "col-2",
              "field": "contactPerson",
              "title": "Contact Person",
              "type": "text",
              "width": 180,
              "required": true
            },
            {
              "id": "col-3",
              "field": "department",
              "title": "Department",
              "type": "text",
              "width": 150
            },
            {
              "id": "col-4",
              "field": "jobTitle",
              "title": "Job Title",
              "type": "text",
              "width": 180
            },
            {
              "id": "col-5",
              "field": "contactNumber",
              "title": "Contact Number",
              "type": "text",
              "width": 120
            },
            {
              "id": "col-6",
              "field": "mobileNumber",
              "title": "Mobile Number",
              "type": "text",
              "width": 120
            },
            {
              "id": "col-7",
              "field": "email",
              "title": "Email",
              "type": "email",
              "width": 220
            }
          ],
          rows: contactRows
        },
        // Case Table
        {
          id: "tbl-case",
          name: "Cases",
          icon: "folder",
          "views": [
            {
              "id": "view-case-table",
              "name": "All Case",
              "type": "table",
              "isDefault": true
            },
            {
              "id": "view-coase-kanban",
              "name": "By Status",
              "type": "kanban",
              "config": {
                "groupByField": "caseStatus"
              }
            }
          ],
          "columns": [
            {
              "id": "col-1",
              "field": "caseId",
              "title": "Case ID",
              "type": "text",
              "width": 120,
              "required": true
            },
            {
              "id": "col-1-1",
              "field": "company",
              "title": "Company",
              "type": "relation",
              "width": 180,
              "relationConfig": {
                "tableId": "tbl-company",
                "displayField": "companyName",
                "multiple": false
              }
            },
            {
              "id": "col-2",
              "field": "salesperson",
              "title": "Salesperson",
              "type": "user",
              "width": 150,
              "relationConfig": {
                "tableId": "tbl-sales",
                "displayField": "name",
                "multiple": false
              }
            },
            {
              "id": "col-3",
              "field": "caseStatus",
              "title": "Case Status",
              "type": "single-select",
              "width": 130,
              "options": [
                {
                  "id": "status-lead",
                  "label": "Lead",
                  "color": "#6b7280"
                },
                {
                  "id": "status-opportunity",
                  "label": "Opportunity",
                  "color": "#3b82f6"
                },
                {
                  "id": "status-pipeline",
                  "label": "Pipeline",
                  "color": "#8b5cf6"
                },
                {
                  "id": "status-closed-won",
                  "label": "Closed-Won",
                  "color": "#10b981"
                },
                {
                  "id": "status-closed-lost",
                  "label": "Closed-Lost",
                  "color": "#ef4444"
                },
                {
                  "id": "status-disqualify",
                  "label": "Disqualify",
                  "color": "#f59e0b"
                }
              ]
            },
            {
              "id": "col-4",
              "field": "caseStatusLastUpdateDate",
              "title": "Status Last Update",
              "type": "date",
              "width": 140
            },
            {
              "id": "col-5",
              "field": "caseStatusDuration",
              "title": "Duration (Days)",
              "type": "number",
              "width": 120
            },
            {
              "id": "col-6",
              "field": "estimateTotalContractValue",
              "title": "Est. Contract Value (HKD)",
              "type": "number",
              "width": 180,
              "decimalPlaces": 0
            },
            {
              "id": "col-7",
              "field": "estimateBookedDate",
              "title": "Est. Booked Date",
              "type": "date",
              "width": 140
            },
            {
              "id": "col-8",
              "field": "projectName",
              "title": "Project Name",
              "type": "text",
              "width": 300
            },
            {
              "id": "col-9",
              "field": "quotations",
              "title": "Quotations",
              "type": "relation",
              "width": 180,
              "relationConfig": {
                "tableId": "tbl-quotation",
                "displayField": "quotationNo",
                "multiple": true
              }
            },
            {
              "id": "col-10",
              "field": "contracts",
              "title": "Contracts",
              "type": "relation",
              "width": 180,
              "relationConfig": {
                "tableId": "tbl-contract",
                "displayField": "contractNo",
                "multiple": true
              }
            }
          ],
          rows: caseRows
        },
        // Quotation Table
        {
          id: "tbl-quotation",
          name: "Quotations",
          icon: "document",
          "views": [
            {
              "id": "view-quot-table",
              "name": "All Quotations",
              "type": "table",
              "isDefault": true
            },
            {
              "id": "view-quot-kanban",
              "name": "By Status",
              "type": "kanban",
              "config": {
                "groupByField": "status"
              }
            },
            {
              "id": "view-1767331914439-qv6phnwef",
              "name": "Group By Salepersoon",
              "type": "table",
              "isDefault": false,
              "config": {
                  "groupBy": {
                      "field": "salesperson",
                      "collapsed": [],
                      "showEmptyGroups": true,
                      "aggregations": [
                          {
                              "field": "totalAmount",
                              "type": "sum"
                          }
                      ]
                  },
                  "filters": [],
                  "sorting": []
              },
              "createdBy": "user-1",
              "visibility": "personal",
              "baseTableId": "tbl-quotation",
              "createdAt": "2026-01-02T05:31:54.439Z",
              "updatedAt": "2026-01-02T05:32:10.754Z",
              "columns": [
                  {
                      "id": "vcol-1767331914457-48h6hs41m",
                      "columnId": "col-1",
                      "field": "caseId",
                      "sourceTableId": "tbl-quotation",
                      "sourceType": "base",
                      "visible": true,
                      "order": 0,
                      "width": 120
                  },
                  {
                      "id": "vcol-1767331914457-3geme2oax",
                      "columnId": "col-1-1",
                      "field": "companyId",
                      "sourceTableId": "tbl-quotation",
                      "sourceType": "base",
                      "visible": true,
                      "order": 1,
                      "width": 220
                  },
                  {
                      "id": "vcol-1767331914457-z1h4qgbvb",
                      "columnId": "col-2",
                      "field": "quotationNo",
                      "sourceTableId": "tbl-quotation",
                      "sourceType": "base",
                      "visible": true,
                      "order": 2,
                      "width": 130
                  },
                  {
                      "id": "vcol-1767331914457-xcvj5wsmn",
                      "columnId": "col-3",
                      "field": "salesperson",
                      "sourceTableId": "tbl-quotation",
                      "sourceType": "base",
                      "visible": true,
                      "order": 3,
                      "width": 150
                  },
                  
                  {
                      "id": "vcol-1767331914457-k7ixhdb23",
                      "columnId": "col-5",
                      "field": "lineItems",
                      "sourceTableId": "tbl-quotation",
                      "sourceType": "base",
                      "visible": true,
                      "order": 4,
                      "width": 250
                  },
                  {
                      "id": "vcol-1767331914457-ayz1gc829",
                      "columnId": "col-6",
                      "field": "totalAmount",
                      "sourceTableId": "tbl-quotation",
                      "sourceType": "base",
                      "visible": true,
                      "order": 5,
                      "width": 180
                  },
                  {
                      "id": "vcol-1767331914457-av5yuixtx",
                      "columnId": "col-4",
                      "field": "specialNotes",
                      "sourceTableId": "tbl-quotation",
                      "sourceType": "base",
                      "visible": true,
                      "order": 6,
                      "width": 300
                  }
              ]
            }
          ],
          "columns": [
            {
              "id": "col-1",
              "field": "caseId",
              "title": "Case",
              "type": "relation",
              "width": 120,
              "relationConfig": {
                "tableId": "tbl-case",
                "displayField": "caseId",
                "multiple": false
              }
            },
            {
              "id": "col-1-1",
              "field": "companyId",
              "title": "Company Name",
              "type": "relation",
              "width": 120,
              "relationConfig": {
                "tableId": "tbl-company",
                "displayField": "companyName",
                "multiple": false
              }
            },
            {
              "id": "col-2",
              "field": "quotationNo",
              "title": "Quotation No.",
              "type": "text",
              "width": 130,
              "required": true
            },
            {
              "id": "col-3",
              "field": "salesperson",
              "title": "Salesperson",
              "type": "user",
              "width": 150,
              "relationConfig": {
                "tableId": "tbl-sales",
                "displayField": "name",
                "multiple": false
              }
            },
            {
              "id": "col-4",
              "field": "specialNotes",
              "title": "Special Notes",
              "type": "textarea",
              "width": 300
            },
            {
              "id": "col-5",
              "field": "lineItems",
              "title": "Description",
              "type": "relation",
              "width": 200,
              "relationConfig": {
                "tableId": "tbl-quotation-line",
                "displayField": "description",
                "multiple": true
              }
            },
            {
              "id": "col-6",
              "field": "totalAmount",
              "title": "Total Amount (HKD)",
              "type": "number",
              "width": 160,
              "decimalPlaces": 0,
              "rollup": {
                "sourceField": "lineItems",
                "aggregation": "sum",
                "targetField": "netAmount"
              }
            }
          ],
          rows: quotationRows
        },
        // Quotation Line Table
        {
          id: "tbl-quotation-line",
          name: "Quotation Lines",
          icon: "list",
          "views": [
            {
              "id": "view-ql-table",
              "name": "All Lines",
              "type": "table",
              "isDefault": true
            }
          ],
          "columns": [
            {
              "id": "col-1",
              "field": "caseId",
              "title": "Case",
              "type": "relation",
              "width": 120,
              "relationConfig": {
                "tableId": "tbl-case",
                "displayField": "caseId",
                "multiple": false
              }
            },
            {
              "id": "col-2",
              "field": "quotationId",
              "title": "Quotation",
              "type": "relation",
              "width": 130,
              "relationConfig": {
                "tableId": "tbl-quotation",
                "displayField": "quotationNo",
                "multiple": false
              }
            },
            {
              "id": "col-3",
              "field": "itemNo",
              "title": "Item No.",
              "type": "number",
              "width": 80
            },
            {
              "id": "col-4",
              "field": "description",
              "title": "Description",
              "type": "text",
              "width": 300
            },
            {
              "id": "col-5",
              "field": "quantity",
              "title": "Quantity",
              "type": "number",
              "width": 100
            },
            {
              "id": "col-6",
              "field": "unitPrice",
              "title": "Unit Price (HKD)",
              "type": "number",
              "width": 140,
              "decimalPlaces": 2
            },
            {
              "id": "col-7",
              "field": "netAmount",
              "title": "Net Amount (HKD)",
              "type": "number",
              "width": 150,
              "decimalPlaces": 2,
              "numberFormat": "currency",
              "currencySymbol": "$",
              "currencyPosition": "prefix",
              "formula": "quantity * unitPrice"
            }
          ],
          rows: quotationLineRows
        },
        // Contract Table
        {
          id: "tbl-contract",
          name: "Contracts",
          icon: "document-checked",
          "views": [
            {
              "id": "view-contract-table",
              "name": "All Contracts",
              "type": "table",
              "isDefault": true
            },
            {
              "id": "view-contract-kanban",
              "name": "By Status",
              "type": "kanban",
              "config": {
                "groupByField": "salesperson"
              }
            }
          ],
          "columns": [
            {
              "id": "col-1",
              "field": "caseId",
              "title": "Case",
              "type": "relation",
              "width": 120,
              "relationConfig": {
                "tableId": "tbl-case",
                "displayField": "caseId",
                "multiple": false
              }
            },
            {
              "id": "col-1-1",
              "field": "companyId",
              "title": "Company Name",
              "type": "relation",
              "width": 120,
              "relationConfig": {
                "tableId": "tbl-company",
                "displayField": "companyName",
                "multiple": false
              }
            },
            {
              "id": "col-2",
              "field": "contractNo",
              "title": "Contract No.",
              "type": "text",
              "width": 130,
              "required": true
            },
            {
              "id": "col-3",
              "field": "contractStartDate",
              "title": "Contract Start Date",
              "type": "date",
              "width": 120
            },
            {
              "id": "col-4",
              "field": "contractExpiryDate",
              "title": "Contract Expiry Date",
              "type": "date",
              "width": 120
            },
            {
              "id": "col-5",
              "field": "quotationId",
              "title": "Quotation",
              "type": "relation",
              "width": 130,
              "relationConfig": {
                "tableId": "tbl-quotation",
                "displayField": "quotationNo",
                "multiple": false
              }
            },
            {
              "id": "col-6",
              "field": "salesperson",
              "title": "Salesperson",
              "type": "user",
              "width": 150,
              "relationConfig": {
                "tableId": "tbl-sales",
                "displayField": "name",
                "multiple": false
              }
            },
            {
              "id": "col-7",
              "field": "specialNotes",
              "title": "Special Notes",
              "type": "textarea",
              "width": 300
            },
            {
              "id": "col-8",
              "field": "lineItems",
              "title": "Description",
              "type": "relation",
              "width": 200,
              "relationConfig": {
                "tableId": "tbl-contract-line",
                "displayField": "description",
                "multiple": true
              }
            },
            {
              "id": "col-9",
              "field": "totalAmount",
              "title": "Total Amount (HKD)",
              "type": "number",
              "width": 160,
              "decimalPlaces": 0,
              "rollup": {
                "sourceField": "lineItems",
                "aggregation": "sum",
                "targetField": "netAmount"
              }
            }
          ],
          rows: contractRows
        },
        // Contract Line Table
        {
          id: "tbl-contract-line",
          name: "Contract Lines",
          icon: "list",
          "views": [
            {
              "id": "view-cl-table",
              "name": "All Lines",
              "type": "table",
              "isDefault": true
            }
          ],
          "columns": [
            {
              "id": "col-1",
              "field": "caseId",
              "title": "Case",
              "type": "relation",
              "width": 120,
              "relationConfig": {
                "tableId": "tbl-case",
                "displayField": "caseId",
                "multiple": false
              }
            },
            {
              "id": "col-2",
              "field": "contractId",
              "title": "Contract",
              "type": "relation",
              "width": 130,
              "relationConfig": {
                "tableId": "tbl-contract",
                "displayField": "contractNo",
                "multiple": false
              }
            },
            {
              "id": "col-3",
              "field": "itemNo",
              "title": "Item No.",
              "type": "number",
              "width": 80
            },
            {
              "id": "col-4",
              "field": "description",
              "title": "Description",
              "type": "text",
              "width": 300
            },
            {
              "id": "col-5",
              "field": "quantity",
              "title": "Quantity",
              "type": "number",
              "width": 100
            },
            {
              "id": "col-6",
              "field": "unitPrice",
              "title": "Unit Price (HKD)",
              "type": "number",
              "width": 140,
              "decimalPlaces": 0
            },
            {
              "id": "col-7",
              "field": "netAmount",
              "title": "Net Amount (HKD)",
              "type": "number",
              "width": 150,
              "decimalPlaces": 0,
              "formula": "quantity * unitPrice"
            }
          ],
          rows: contractLineRows
        }
      ]
    }
  ]
};

// Write crm-database.json
fs.writeFileSync(
  path.join(__dirname, 'crm-database-new2.json'),
  JSON.stringify(crmDatabase, null, 2)
);

console.log(`✓ crm-database.json generated`);
console.log(`  - Companies: ${companyRows.length}`);
console.log(`  - Contacts: ${contactRows.length}`);
console.log(`  - Cases: ${caseRows.length}`);
console.log(`  - Quotations: ${quotationRows.length}`);
console.log(`  - Quotation Lines: ${quotationLineRows.length}`);
console.log(`  - Contracts: ${contractRows.length}`);
console.log(`  - Contract Lines: ${contractLineRows.length}`);
console.log('\n✓ Conversion complete!');

