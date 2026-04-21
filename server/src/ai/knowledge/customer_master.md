# Customer Master — MISC Pro Customer Management

## Overview
The Customer Master stores all client company records. Projects are linked to customers for tracking and reporting.

## Customer Record Fields
- **Company Name** (required): Official client company name
- **Contact Name**: Primary contact person
- **Email**: Contact email address
- **Phone**: Contact phone number
- **Address Line 1 & 2**: Physical address
- **City, State, Zip**: Location
- **Country**: (Default: USA)
- **Status**: Active or Inactive

## How to Add a Customer

### Method 1: Settings → Customer Master
1. Navigate to Settings → Customer Master
2. Click "Add Customer" button
3. Fill in company name and contact details
4. Save

### Method 2: Quick Add During Project Creation
1. When creating or editing a project in Project Detail
2. In the "Customer Master" field, click the "+" (UserPlus) icon
3. A Quick Add modal opens — enter the company name and contact
4. Save — the new customer is immediately linked to the project

## Linking a Customer to a Project
1. Open the Project Detail page
2. In the "Customer Master" dropdown, start typing the company name
3. Select from the auto-complete suggestions
4. The project is now linked to that customer

## Customer Reports
- All projects are grouped and reportable by customer
- The project list in the left sidebar shows the customer name for each project
- The Calculation Summary header shows the customer name

## Who Can Access Customer Records

### Estimator
- Can view the company's customer list to link to projects
- Cannot add or edit customer records (read-only access)

### Admin
- Full CRUD: can create, edit, deactivate customers
- Can view all customer records and their associated projects
- Can export customer lists

## Inactive Customers
- Setting a customer to Inactive hides them from the project creation dropdown
- Their historical project records remain intact
- To reactivate: edit the record and set status back to Active

## Legacy Customer Names
Some older projects may have a customer_name text field rather than a linked Customer record.
- These show a yellow "Legacy Customer" warning in the project detail
- You can link them to a Customer Master record by selecting one from the dropdown
- The text name is preserved for reference
