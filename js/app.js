// Main JavaScript for the logistics management system

document.addEventListener('DOMContentLoaded', function() {
    // Load bills and update UI
    loadBills();
    
    // Add event listeners
    document.getElementById('searchButton').addEventListener('click', handleSearch);
    document.getElementById('newBillButton').addEventListener('click', function() {
        window.location.href = 'bill-form.php';
    });
    
    // Handle bill action buttons (event delegation)
    document.getElementById('billsTableBody').addEventListener('click', function(e) {
        const target = e.target;
        
        if (target.tagName === 'BUTTON') {
            const billId = target.dataset.id;
            
            if (target.classList.contains('view-button')) {
                window.open(`bill.php?id=${billId}`, '_blank');
            } else if (target.classList.contains('edit-button')) {
                window.location.href = `bill-form.php?edit=true&id=${billId}`;
            } else if (target.classList.contains('delete-button')) {
                if (confirm('Are you sure you want to delete this bill?')) {
                    deleteBill(billId);
                }
            } else if (target.classList.contains('download-button')) {
                window.location.href = `api/download_bill.php?id=${billId}`;
            }
        }
    });
});

// Load bills from server or local storage
async function loadBills() {
    try {
        // Try to fetch bills from server
        const response = await fetch('api/get_bills.php');
        if (!response.ok) throw new Error('Failed to fetch bills');
        
        const bills = await response.json();
        displayBills(bills);
        updateStats(bills);
    } catch (error) {
        console.error('Error loading bills:', error);
        
        // Fall back to localStorage
        const storedBills = localStorage.getItem('bills');
        if (storedBills) {
            const bills = JSON.parse(storedBills);
            displayBills(bills);
            updateStats(bills);
        }
    }
}

// Display bills in the table
function displayBills(bills) {
    const tableBody = document.getElementById('billsTableBody');
    tableBody.innerHTML = '';
    
    // Sort bills by date (newest first)
    bills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (bills.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 30px;">
                    No bills found. Create your first bill!
                </td>
            </tr>
        `;
        return;
    }
    
    bills.forEach(bill => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${bill.billNo}</td>
            <td>${bill.date}</td>
            <td>${bill.toMs}</td>
            <td>₹${Number(bill.grandTotal).toLocaleString('en-IN')}</td>
            <td class="action-buttons">
                <button class="view-button" data-id="${bill.id}">View</button>
                <button class="edit-button" data-id="${bill.id}">Edit</button>
                <button class="download-button" data-id="${bill.id}">Download</button>
                <button class="delete-button" data-id="${bill.id}">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Update statistics
function updateStats(bills) {
    document.getElementById('totalBillsCount').textContent = bills.length;
    
    const totalAmount = bills.reduce((sum, bill) => 
        sum + parseFloat(bill.grandTotal || 0), 0);
        
    document.getElementById('totalAmount').textContent = 
        `₹${totalAmount.toLocaleString('en-IN')}`;
}

// Handle search
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm.trim()) {
        loadBills(); // Reset to show all bills
        return;
    }
    
    // Get bills from current display
    const bills = Array.from(document.querySelectorAll('#billsTableBody tr'))
        .map(row => {
            const cols = row.querySelectorAll('td');
            if (cols.length < 4) return null;
            
            return {
                billNo: cols[0].textContent,
                date: cols[1].textContent,
                toMs: cols[2].textContent,
                grandTotal: cols[3].textContent,
                id: row.querySelector('button').dataset.id
            };
        })
        .filter(bill => bill !== null);
    
    // Filter bills based on search term
    const filteredBills = bills.filter(bill => 
        bill.billNo.toLowerCase().includes(searchTerm) || 
        bill.toMs.toLowerCase().includes(searchTerm)
    );
    
    displayBills(filteredBills);
}

// Delete a bill
async function deleteBill(billId) {
    try {
        const response = await fetch(`api/delete_bill.php?id=${billId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete bill');
        
        const result = await response.json();
        
        if (result.success) {
            alert('Bill deleted successfully');
            loadBills(); // Reload bills
        } else {
            throw new Error(result.message || 'Unknown error');
        }
    } catch (error) {
        console.error('Error deleting bill:', error);
        alert('Failed to delete bill: ' + error.message);
    }
}
