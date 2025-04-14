/**
 * API Service for Logistics Management System
 * Handles all server communications
 */

const API_URL = 'http://localhost:3000/api';

/**
 * Fetch all bills from the server
 * @returns {Promise<Array>} Array of bill objects
 */
async function fetchBills() {
    try {
        const response = await fetch(`${API_URL}/bills`);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching bills:', error);
        return [];
    }
}

/**
 * Fetch a single bill by ID
 * @param {string} id - The bill ID
 * @returns {Promise<Object|null>} Bill object or null if not found
 */
async function fetchBillById(id) {
    try {
        const response = await fetch(`${API_URL}/bills/${id}`);
        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`HTTP error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching bill ${id}:`, error);
        return null;
    }
}

/**
 * Create a new bill
 * @param {Object} billData - The bill data
 * @returns {Promise<Object|null>} Created bill object or null if failed
 */
async function createBill(billData) {
    try {
        const response = await fetch(`${API_URL}/bills`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(billData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error creating bill:', error);
        return null;
    }
}

/**
 * Update an existing bill
 * @param {string} id - The bill ID
 * @param {Object} billData - The updated bill data
 * @returns {Promise<Object|null>} Updated bill object or null if failed
 */
async function updateBill(id, billData) {
    try {
        const response = await fetch(`${API_URL}/bills/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(billData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error updating bill ${id}:`, error);
        return null;
    }
}

/**
 * Delete a bill
 * @param {string} id - The bill ID
 * @returns {Promise<boolean>} True if deleted successfully, false otherwise
 */
async function deleteBill(id) {
    try {
        const response = await fetch(`${API_URL}/bills/${id}`, {
            method: 'DELETE'
        });
        
        return response.ok;
    } catch (error) {
        console.error(`Error deleting bill ${id}:`, error);
        return false;
    }
}

/**
 * Generate current bill number based on date and count
 * @returns {Promise<string>} Generated bill number
 */
async function generateBillNumber() {
    try {
        const bills = await fetchBills();
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        // Count bills for current month
        const prefix = `ARC/${year}/${month}`;
        const monthBills = bills.filter(bill => bill.billNo.startsWith(prefix));
        const count = monthBills.length + 1;
        
        return `${prefix}/${String(count).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating bill number:', error);
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `ARC/${year}/${month}/001`;
    }
}

/**
 * Download a bill as PDF
 * @param {string} id - The bill ID
 */
async function downloadBillAsPDF(id) {
    try {
        const bill = await fetchBillById(id);
        if (!bill) {
            throw new Error('Bill not found');
        }
        
        // Create an iframe to render the bill for PDF download
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        iframe.onload = function() {
            // After the bill is loaded, trigger the print dialog with Save as PDF option
            setTimeout(() => {
                iframe.contentWindow.print();
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 2000);
            }, 1000);
        };
        
        // Load the bill page in the iframe
        iframe.src = `bill.html?id=${id}&download=true`;
    } catch (error) {
        console.error(`Error downloading bill ${id}:`, error);
        alert('Failed to download the bill. Please try again.');
    }
}

/**
 * Bulk download multiple bills as a zip file
 * @param {Array<string>} ids - Array of bill IDs to download
 */
async function downloadMultipleBills(ids) {
    try {
        if (!ids || ids.length === 0) {
            throw new Error('No bills selected for download');
        }
        
        // Create a hidden form to submit for bulk download
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `${API_URL}/bills/download`;
        form.style.display = 'none';
        
        // Add bill IDs as form inputs
        ids.forEach(id => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'ids[]';
            input.value = id;
            form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
        
        setTimeout(() => {
            document.body.removeChild(form);
        }, 2000);
    } catch (error) {
        console.error('Error downloading multiple bills:', error);
        alert('Failed to download the selected bills. Please try again.');
    }
}

/**
 * Generate a printable HTML version of a bill
 * @param {Object} bill - The bill data
 * @returns {string} HTML content for the bill
 */
function generateBillHTML(bill) {
    if (!bill) return '';
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bill ${bill.billNo}</title>
            <style>
                /* Include all the necessary styles for printing */
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 0;
                    width: 210mm;
                    height: 297mm;
                    box-sizing: border-box;
                    background-color: #ffffff;
                }
                .invoice {
                    padding: 10mm 8mm;
                    height: 100%;
                    box-sizing: border-box;
                    background-color: #ffffff;
                }
                .header {
                    text-align: center;
                    margin-bottom: 12px;
                    padding-bottom: 10px;
                    border-bottom: 3px solid #2c3e50;
                }
                /* Include remaining styles... */
            </style>
        </head>
        <body>
            <div class="invoice">
                <!-- Generate the complete bill HTML structure -->
                <!-- ... -->
            </div>
        </body>
        </html>
    `;
}
