/**
 * API Service for Logistics Management System
 * Handles all API calls to the server
 */

// Base URL for API calls - adapts to current environment
const BASE_URL = window.location.origin;

/**
 * Fetch all bills from the server
 * @returns {Promise<Array>} Array of bills
 */
async function fetchBills() {
    try {
        const response = await fetch(`${BASE_URL}/api/bills`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching bills:', error);
        // Return empty array instead of throwing to prevent cascading errors
        return [];
    }
}

/**
 * Fetch a bill by ID
 * @param {string} id - The bill ID
 * @returns {Promise<Object|null>} The bill object or null if not found
 */
async function fetchBillById(id) {
    try {
        const response = await fetch(`${BASE_URL}/api/bills/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching bill ${id}:`, error);
        return null;
    }
}

/**
 * Create a new bill
 * @param {Object} billData - The bill data to create
 * @returns {Promise<Object|null>} The created bill or null if error
 */
async function createBill(billData) {
    try {
        const response = await fetch(`${BASE_URL}/api/bills`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(billData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating bill:', error);
        throw error; // Rethrow to allow form to handle the error
    }
}

/**
 * Update an existing bill
 * @param {string} id - The bill ID
 * @param {Object} billData - The updated bill data
 * @returns {Promise<Object|null>} The updated bill or null if error
 */
async function updateBill(id, billData) {
    try {
        const response = await fetch(`${BASE_URL}/api/bills/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(billData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error updating bill ${id}:`, error);
        throw error; // Rethrow to allow form to handle the error
    }
}

/**
 * Delete a bill
 * @param {string} id - The bill ID to delete
 * @returns {Promise<boolean>} True if successfully deleted
 */
async function deleteBill(id) {
    try {
        const response = await fetch(`${BASE_URL}/api/bills/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error(`Error deleting bill ${id}:`, error);
        return false;
    }
}

/**
 * Generate a new bill number based on existing bills
 * @returns {Promise<string>} A new bill number
 */
async function generateBillNumber() {
    try {
        const bills = await fetchBills();
        
        // If no bills or error fetching, start with default
        if (!bills || bills.length === 0) {
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            return `ARC/${year}/001`;
        }
        
        // Find latest bill number with format ARC/YYYY/NNN
        const billNumbers = bills
            .map(bill => bill.billNo)
            .filter(billNo => /^ARC\/\d{4}\/\d{3}$/.test(billNo));
        
        if (billNumbers.length === 0) {
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            return `ARC/${year}/001`;
        }
        
        // Sort in descending order to get the latest
        billNumbers.sort().reverse();
        const latestBillNo = billNumbers[0];
        
        // Extract parts
        const parts = latestBillNo.split('/');
        const year = new Date().getFullYear();
        const currentYear = parts[1];
        let number = parseInt(parts[2]);
        
        // If year changed, reset number
        if (currentYear != year) {
            number = 0;
        }
        
        // Increment and pad with zeros
        number++;
        const paddedNumber = number.toString().padStart(3, '0');
        
        return `ARC/${year}/${paddedNumber}`;
    } catch (error) {
        console.error('Error generating bill number:', error);
        // Fallback to timestamp-based number if all else fails
        const timestamp = Date.now().toString().substr(-6);
        return `ARC/${timestamp}`;
    }
}

// Export all functions
window.apiService = {
    fetchBills,
    fetchBillById,
    createBill,
    updateBill,
    deleteBill,
    generateBillNumber
};
