/**
 * API Fallback for handling failures
 * Only loads if the main API service fails
 */

(function() {
  // Check if we already have the API service
  if (window.apiService) {
    return;
  }
  
  console.warn('Using API fallback service - API service failed to load');
  
  // Function to get data from localStorage as fallback
  function getLocalData(key, defaultValue = []) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Error getting ${key} from localStorage:`, e);
      return defaultValue;
    }
  }
  
  // Function to save data to localStorage as fallback
  function saveLocalData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`Error saving ${key} to localStorage:`, e);
      return false;
    }
  }
  
  // Fallback API service
  window.apiService = {
    fetchBills: async function() {
      console.warn('Using localStorage fallback for fetchBills');
      return getLocalData('billRecords', []);
    },
    
    fetchBillById: async function(id) {
      console.warn('Using localStorage fallback for fetchBillById');
      const bills = getLocalData('billRecords', []);
      return bills.find(bill => bill.id === id) || null;
    },
    
    createBill: async function(billData) {
      console.warn('Using localStorage fallback for createBill');
      const bills = getLocalData('billRecords', []);
      
      // Add timestamp if not provided
      if (!billData.createdAt) {
        billData.createdAt = new Date().toISOString();
      }
      
      // Add unique ID if not provided
      if (!billData.id) {
        billData.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
      }
      
      bills.push(billData);
      saveLocalData('billRecords', bills);
      
      return billData;
    },
    
    updateBill: async function(id, billData) {
      console.warn('Using localStorage fallback for updateBill');
      const bills = getLocalData('billRecords', []);
      const index = bills.findIndex(bill => bill.id === id);
      
      if (index !== -1) {
        bills[index] = { ...billData, id };
        saveLocalData('billRecords', bills);
        return bills[index];
      }
      
      return null;
    },
    
    deleteBill: async function(id) {
      console.warn('Using localStorage fallback for deleteBill');
      const bills = getLocalData('billRecords', []);
      const filteredBills = bills.filter(bill => bill.id !== id);
      
      if (filteredBills.length < bills.length) {
        saveLocalData('billRecords', filteredBills);
        return true;
      }
      
      return false;
    },
    
    generateBillNumber: async function() {
      console.warn('Using localStorage fallback for generateBillNumber');
      const bills = getLocalData('billRecords', []);
      
      // If no bills, start with default
      if (bills.length === 0) {
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
      billNumbers.sort().reverse();
      const latestBillNo = billNumbers[0];
      
      // Extract parts and increment
      const parts = latestBillNo.split('/');
      const year = new Date().getFullYear();
      const number = parseInt(parts[2]) + 1;
      const paddedNumber = number.toString().padStart(3, '0');
      
      return `ARC/${year}/${paddedNumber}`;
    }
  };
})();
