# Database Demo Requirements

## Introduction
This is a demo to demonstrate the new 6.0 database system in DocPal.In 6.0, Database management is a new core feature that combine Case management, workflow, document management, eform, dashoard and more. 

## Architecture
- Database can have many tables.
- Database can have many forms.
- Database can have many dashboards.
- Tables columns data type can be
 - Text
 - Textarea
 - Number
 - Date
 - Single Select
 - Multi select
 - Checkbox
 - Switch
 - Attachment
 - Rating
 - Url Link
 - Email ( Email Address )
 - User ( User )
 - Relation ( Relation to another table )
 - Fx ( Function Expression )

## Permissions
- A Database have 4 permissions:
  - Read
  - Write
  - Delete
  - Manage
- Admin / Owner can assign permissions to users or roles.
- Table / Dashboard have 4 permissions:
  - Read
  - Write
  - Delete
  - Manage
- Admin / Owner can assign permissions to users or roles.

## Workflow
- Admin / Owner / User with Manage permission can add trigger to a table.
- Trigger can be triggered by:
  - Manual
  - Automatic
  - Scheduled
  - On Change
  - On Create
  - On Delete
  - On Update


## UI 
- Database(root) is a list of databases. admin user can create a new database.
- database detail have 2 panel, left side is list of tables, forms, dashboards and setting. right side is detail of selected item.
- All Data Detail have filter and sorting, filter and sorting support multiple conditions.


## Demo Data
- CRM Database with these tables:
- Company Table:
  - Name
  - Email
  - Phone
  - Address
  - Contracts
  - Quotations
  - Contacts
  - Type
  - Sales person (user)
- Contact Table:
  - Name
  - Email
  - Phone
  - Company
- Quotation Table:
  - Company
  - Quotation number
  - Contact Person
  - Quotation Date
  - Quotation Amount
  - Quotation Lines
  - Total Amount
  - Sales person (user)
  - Status
- Quotation Line Table:
  - Quotation
  - Product
  - Quantity
  - Unit Price
  - Total Price
  - Discount
  - Tax
- Contract Table:
  - Company
  - Quotation
  - Contract Number
  - Contract Date
  - Contract Amount
  - Contract Lines
  - Total Amount
  - Status
  - Sales person (user)
- Contract Line Table:
  - Contract
  - Product
  - Quantity
  - Unit Price
  - Total Price
  - Discount
  - Grand Total
