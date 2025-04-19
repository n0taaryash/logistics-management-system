/**
 * API Service with error handling for Vercel deployment
 * Handles common issues with blocked requests and parsing
 */

// Determine the base URL dynamically
const BASE_URL = window.location.origin;

/**
 * Send a request with special handling for blocked resources
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
async function safeRequest(url, options = {}) {
  // Default options
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Add these headers to avoid being blocked
      'X-Requested-By': 'logistics-system',
    },
    // Add cache-busting parameter
    cache: 'no-store',
  };

  try {
    // Add a timestamp to bypass cache blockers
    const timestamp = Date.now();
    const separator = url.includes('?') ? '&' : '?';
    const cacheBustUrl = `${url}${separator}_t=${timestamp}`;
    
    console.log(`Making request to: ${cacheBustUrl}`);
    
    // Try using standard fetch first
    try {
      const response = await fetch(cacheBustUrl, {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...(options.headers || {})
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      // For JSON responses
      if (response.headers.get('content-type')?.includes('application/json')) {
        return await response.json();
      }
      
      // For other response types
      return await response.text();
    } catch (fetchError) {
      console.warn('Fetch failed, trying alternative approach:', fetchError);
      
      // Fallback to localStorage if available
      if (options.method === 'GET' && localStorage) {
        const cachedData = localStorage.getItem(`cache_${url}`);
        if (cachedData) {
          console.log('Using cached data from localStorage');
          return JSON.parse(cachedData);
        }
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error(`API request error for ${url}:`, error);
    throw error;
  }
}

/**
 * Get all bills
 * @returns {Promise<Array>} Array of bills
 */
async function fetchBills() {
  try {
    const data = await safeRequest(`${BASE_URL}/api/bills`);
    
    // Cache the result in localStorage for fallback
    if (data && localStorage) {
      localStorage.setItem('cache_/api/bills', JSON.stringify(data));
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching bills:', error);
    
    // Try to get from localStorage as fallback
    try {
      const cachedData = localStorage.getItem('billRecords') || localStorage.getItem('cache_/api/bills');
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (e) {
      console.error('Error reading from cache:', e);
    }
    
    return []; // Return empty array as last resort
  }
}

/**
 * Get a bill by ID
 * @param {string} id - Bill ID
 * @returns {Promise<Object|null>} Bill object or null
 */
async function fetchBillById(id) {
  try {
    const data = await safeRequest(`${BASE_URL}/api/bills/${id}`);
    return data;
  } catch (error) {
    console.error(`Error fetching bill ${id}:`, error);
    
    // Try to get from localStorage as fallback
    try {
      const bills = JSON.parse(localStorage.getItem('billRecords') || '[]');
      return bills.find(bill => bill.id === id) || null;
    } catch (e) {
      console.error('Error reading from cache:', e);
      return null;
    }
  }
}

/**
 * Create a new bill
 * @param {Object} billData - New bill data
 * @returns {Promise<Object>} Created bill
 */
async function createBill(billData) {
  try {
    const data = await safeRequest(`${BASE_URL}/api/bills`, {
      method: 'POST',
      body: JSON.stringify(billData)
    });
    
    // Update local cache
    try {
      const bills = JSON.parse(localStorage.getItem('billRecords') || '[]');
      bills.push(data);
      localStorage.setItem('billRecords', JSON.stringify(bills));
      localStorage.setItem('cache_/api/bills', JSON.stringify(bills));
    } catch (e) {
      console.error('Error updating local cache:', e);
    }
    
    return data;
  } catch (error) {
    console.error('Error creating bill:', error);
    
    // Fallback to localStorage if API fails
    try {
      const bills = JSON.parse(localStorage.getItem('billRecords') || '[]');
      
      // Add ID and timestamp if not present
      if (!billData.id) {
        billData.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
      }
      if (!billData.createdAt) {
        billData.createdAt = new Date().toISOString();
      }
      
      bills.push(billData);
      localStorage.setItem('billRecords', JSON.stringify(bills));
      localStorage.setItem('cache_/api/bills', JSON.stringify(bills));
      
      return billData;
    } catch (e) {
      console.error('Local storage fallback failed:', e);
      throw error;
    }
  }
}

/**
 * Update an existing bill
 * @param {string} id - Bill ID
 * @param {Object} billData - Updated bill data
 * @returns {Promise<Object>} Updated bill
 */
async function updateBill(id, billData) {
  try {
    const data = await safeRequest(`${BASE_URL}/api/bills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(billData)
    });
    
    // Update local cache
    try {
      const bills = JSON.parse(localStorage.getItem('billRecords') || '[]');
      const index = bills.findIndex(bill => bill.id === id);
      if (index !== -1) {
        bills[index] = data;
        localStorage.setItem('billRecords', JSON.stringify(bills));
        localStorage.setItem('cache_/api/bills', JSON.stringify(bills));
      }
    } catch (e) {
      console.error('Error updating local cache:', e);
    }
    
    return data;
  } catch (error) {
    console.error(`Error updating bill ${id}:`, error);
    
    // Fallback to localStorage if API fails
    try {
      const bills = JSON.parse(localStorage.getItem('billRecords') || '[]');
      const index = bills.findIndex(bill => bill.id === id);
      
      if (index !== -1) {
        bills[index] = {...billData, id};
        localStorage.setItem('billRecords', JSON.stringify(bills));
        localStorage.setItem('cache_/api/bills', JSON.stringify(bills));
        return bills[index];
      } else {
        throw new Error('Bill not found');
      }
    } catch (e) {
      console.error('Local storage fallback failed:', e);
      throw error;
    }
  }
}

/**
 * Delete a bill
 * @param {string} id - Bill ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteBill(id) {
  try {
    await safeRequest(`${BASE_URL}/api/bills/${id}`, {
      method: 'DELETE'
    });
    
    // Update local cache
    try {
      const bills = JSON.parse(localStorage.getItem('billRecords') || '[]');
      const filteredBills = bills.filter(bill => bill.id !== id);
      localStorage.setItem('billRecords', JSON.stringify(filteredBills));
      localStorage.setItem('cache_/api/bills', JSON.stringify(filteredBills));
    } catch (e) {
      console.error('Error updating local cache:', e);
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting bill ${id}:`, error);
    
    // Fallback to localStorage if API fails
    try {
      const bills = JSON.parse(localStorage.getItem('billRecords') || '[]');
      const filteredBills = bills.filter(bill => bill.id !== id);
      
      if (filteredBills.length < bills.length) {
        localStorage.setItem('billRecords', JSON.stringify(filteredBills));
        localStorage.setItem('cache_/api/bills', JSON.stringify(filteredBills));
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.error('Local storage fallback failed:', e);
      return false;
    }
  }
}

/**
 * Generate a new bill number
 * @returns {Promise<string>} New bill number
 */
async function generateBillNumber() {
  try {
    const bills = await fetchBills();
    
    // If no bills, start with default
    if (!bills || bills.length === 0) {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      return `ARC/${year}/001`;
    }
    
    // Find latest bill number
    const billNumbers = bills
      .map(bill => bill.billNo)
      .filter(billNo => /^ARC\/\d{4}\/\d{3}$/.test(billNo));
    
    if (billNumbers.length === 0) {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      return `ARC/${year}/001`;
    }
    
    // Sort in descending order to get the latest
    billNumbers.sort();
    const latestBillNo = billNumbers[billNumbers.length - 1];
    
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
    
    // Fallback to timestamp-based number
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

console.log('API service loaded with fallback support');
