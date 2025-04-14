/**
 * Print Helper Functions for Logistics Management System
 * Provides utilities to ensure high-quality printed output
 */

// Check if the browser supports color printing
function browserSupportsPrintColors() {
    const isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    
    // Chrome and Firefox support color printing
    return isChrome || isFirefox;
}

// Format a bill for optimal printing
function optimizeBillForPrinting() {
    // Add a class to the body for print-specific styles
    document.body.classList.add('printing-mode');
    
    // Force table elements to avoid page breaks inside rows
    const tableRows = document.querySelectorAll('tr');
    tableRows.forEach(row => {
        row.style.pageBreakInside = 'avoid';
    });
    
    // Ensure background colors are printed
    if (!browserSupportsPrintColors()) {
        // For browsers that don't support color printing well,
        // we can add visible borders to tables and elements
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            table.style.border = '1px solid #2c3e50';
        });
        
        const cells = document.querySelectorAll('td, th');
        cells.forEach(cell => {
            cell.style.border = '1px solid #7f8c8d';
        });
    }
}

// Triggers print dialog with optimized settings
function printDocument() {
    optimizeBillForPrinting();
    window.print();
}

// Opens bill in a print-friendly format
function openPrintableBill(billId) {
    const records = JSON.parse(localStorage.getItem('billRecords') || '[]');
    const bill = records.find(record => record.id === billId);
    
    if (!bill) {
        alert('Bill not found!');
        return;
    }
    
    // Store the bill data for viewing
    localStorage.setItem('billData', JSON.stringify(bill));
    
    // Open the bill in a new tab with print parameter
    window.open('bill.html?print=true', '_blank');
}

// Save bill as PDF
function saveBillAsPDF(billId) {
    // We'll use the system's print to PDF functionality
    openPrintableBill(billId);
}
