# Logistics Management System

A complete logistics management system for Abhi Road Carrier with bill generation, storage, and management capabilities.

## Features

- Create, view, edit, and delete bills
- Dashboard with statistics and filtering options
- Print bills or save as PDF
- Download single or multiple bills
- Export data to Excel
- Company signature and stamp on bills
- Persistent storage using JSON files

## Installation

1. Make sure you have [Node.js](https://nodejs.org/) installed (v12.x or later)

2. Clone or download this repository

3. Install dependencies:

```bash
cd logistics-management-system
npm install
```

4. Start the server:

```bash
npm start
```

5. Open your browser and navigate to:

```
http://localhost:3000
```

## Usage

### Dashboard

- View all bills with filtering and sorting options
- Click on the eye icon to view bill details
- Click on the edit icon to modify a bill
- Click on the trash icon to delete a bill
- Click on the download icon to download a bill as PDF
- Select multiple bills using checkboxes to download them as a zip file

### Creating Bills

1. Click on "Create New Bill" from the dashboard
2. Fill in all required fields
3. Add as many items as needed using the "Add Row" button
4. Click "Generate Bill" to save and view the bill

### Printing Bills

- When viewing a bill, click the "Print Bill" button
- In the print dialog, select your printer or "Save as PDF" option
- Note: "Checked By" and "Prepared By" information appears only in the digital view, not in printed bills

### Settings

1. Go to the Settings page
2. Upload your company signature and stamp images
3. Set the "Checked By" and "Prepared By" names that appear on digital bills

### Exporting Data

- From the dashboard, use the "Export to Excel" button to download all filtered records as a CSV file

## System Requirements

- Node.js v12.x or later
- Modern web browser (Chrome, Firefox, Edge recommended)
- Internet connection for initial package installation

## Data Storage

All bills are stored in JSON format in the `data/bills.json` file. This file is automatically created when the server starts up.

## Customizing

You can customize the company information, signature, and stamp images in the Settings page.

# Logistics Management System - PHP Version

## Vercel Deployment Notes

This PHP application is configured for deployment on Vercel using the `vercel-php` runtime.

### Important Files for Deployment:

- `vercel.json` - Configures routes, functions, and environment variables
- `composer.json` - Defines PHP dependencies
- `vercel-php.ini` - PHP configuration for the Vercel environment
- `.vercelignore` - Files to exclude from deployment

### File Storage on Vercel:

Since Vercel's serverless functions have a read-only filesystem, dynamic data (bills) is stored in the `/tmp` directory when running on Vercel. This is a temporary storage solution and data will be lost when the function instances are recycled.

For a production environment, consider implementing:
1. A database solution like MongoDB Atlas
2. A cloud storage solution for generated PDFs
3. User authentication

### Local Development:

When running locally, the application uses the standard file structure with data stored in the `v1/data` directory.
