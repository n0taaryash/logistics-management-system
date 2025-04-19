/**
 * API Service for Logistics Management System
 * Handles all API calls to the server with better error handling and compatibility
 */

// Get base URL - ensure we use the right URL on both local and Vercel
const BASE_URL = window.location.origin;

/**
 * Perform API fetch with improved error handling and fetch options
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
async function apiFetch(url, options = {}) {
  // Default fetch options
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // Helps avoid CORS issues
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    credentials: 'same-origin',
    mode: 'cors'
  };
  
  // Merge with provided options
  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  };
  
  try {
    // Add timestamp to URL to bypass cache
    const separator = url.includes('?') ? '&' : '?';
    const timestampedUrl = `${url}${separator}_t=${Date.now()}`;
    
    const response = await fetch(timestampedUrl, fetchOptions);
    
    if (response.status === 204) {
      // No content response
      return null;
    }
    
    // For non-JSON responses
    if (!response.headers.get('content-type')?.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      return response;
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error(`API fetch error for ${url}:`, error);
    throw error;
  }
}

/**
 * Fetch all bills from the server
 * @returns {Promise<Array>} Array of bills
 */
async function fetchBills() {
  try {
    return await apiFetch(`${BASE_URL}/api/bills`);
  } catch (error) {
    console.error('Error fetching bills:', error);
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
    return await apiFetch(`${BASE_URL}/api/bills/${id}`);
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
    return await apiFetch(`${BASE_URL}/api/bills`, {
      method: 'POST',
      body: JSON.stringify(billData)
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    throw error;
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
    return await apiFetch(`${BASE_URL}/api/bills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(billData)
    });
  } catch (error) {
    console.error(`Error updating bill ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a bill
 * @param {string} id - The bill ID to delete
 * @returns {Promise<boolean>} True if successfully deleted
 */
async function deleteBill(id) {
  try {
    await apiFetch(`${BASE_URL}/api/bills/${id}`, {
      method: 'DELETE'
    });
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
