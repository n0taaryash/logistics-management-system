/**
 * API Service Loader
 * Tries multiple methods to load the API service
 */

(function() {
  // Check if already loaded
  if (window.apiService) {
    console.log('API service already loaded');
    return;
  }
  
  console.log('Loading API service...');
  
  // Create script element
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      
      script.onload = () => {
        console.log(`Script loaded: ${src}`);
        resolve();
      };
      
      script.onerror = () => {
        console.error(`Failed to load script: ${src}`);
        reject();
      };
      
      document.head.appendChild(script);
    });
  }
  
  // Try loading using different approaches
  async function loadApiService() {
    try {
      // Try standard approach first
      await loadScript('/js/api-service.js');
      
      // If loaded successfully, we're done
      if (window.apiService) {
        console.log('API service loaded successfully');
        return;
      }
      
      // If not loaded, try with timestamp to bypass cache
      const timestamp = Date.now();
      await loadScript(`/js/api-service.js?t=${timestamp}`);
      
      if (window.apiService) {
        console.log('API service loaded with timestamp');
        return;
      }
      
      // If all else fails, use the fallback
      console.warn('Loading fallback API service');
      setFallbackApiService();
      
    } catch (error) {
      console.error('Error loading API service:', error);
      setFallbackApiService();
    }
  }
  
  // Create a fallback API service that uses localStorage
  function setFallbackApiService() {
    window.apiService = {
      fetchBills: async function() {
        console.warn('Using localStorage fallback for fetchBills');
        try {
          const data = localStorage.getItem('billRecords');
          return data ? JSON.parse(data) : [];
        } catch (e) {
          console.error('Error reading from localStorage:', e);
          return [];
        }
      },
      
      fetchBillById: async function(id) {
        console.warn('Using localStorage fallback for fetchBillById');
        try {
          const bills = JSON.parse(localStorage.getItem('billRecords') || '[]');
          return bills.find(bill => bill.id === id) || null;
        } catch (e) {
          console.error('Error reading from localStorage:', e);
          return null;
        }
      },
      
      createBill: async function(billData) {
        console.warn('Using localStorage fallback for createBill');
        try {
          const bills = JSON.parse(localStorage.getItem('billRecords') || '[]');
          
          if (!billData.id) {
            billData.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
          }
          
          if (!billData.createdAt) {
            billData.createdAt = new Date().toISOString();
          }
          
          bills.push(billData);
          localStorage.setItem('billRecords', JSON.stringify(bills));
          
          return billData;
        } catch (e) {
          console.error('Error writing to localStorage:', e);
          throw new Error('Failed to create bill: ' + e.message);
        }
      },
      
      updateBill: async function(id, billData) {
        console.warn('Using localStorage fallback for updateBill');
        try {
          const bills = JSON.parse(localStorage.getItem('billRecords') || '[]');
          const index = bills.findIndex(bill => bill.id === id);
          
          if (index === -1) {
            throw new Error('Bill not found');
          }
          
          bills[index] = {...billData, id};
          localStorage.setItem('billRecords', JSON.stringify(bills));
          
          return bills[index];
        } catch (e) {
          console.error('Error updating bill in localStorage:', e);
          throw new Error('Failed to update bill: ' + e.message);
        }
      },
      
      deleteBill: async function(id) {
        console.warn('Using localStorage fallback for deleteBill');
        try {
          const bills = JSON.parse(localStorage.getItem('billRecords') || '[]');
          const filteredBills = bills.filter(bill => bill.id !== id);
          
          localStorage.setItem('billRecords', JSON.stringify(filteredBills));
          
          return true;
        } catch (e) {
          console.error('Error deleting from localStorage:', e);
          return false;
        }
      },
      
      generateBillNumber: async function() {
        console.warn('Using localStorage fallback for generateBillNumber');
        try {
          const bills = JSON.parse(localStorage.getItem('billRecords') || '[]');
          
          if (bills.length === 0) {
            return `ARC/${new Date().getFullYear()}/001`;
          }
          
          const billNumbers = bills
            .map(bill => bill.billNo)
            .filter(billNo => /^ARC\/\d{4}\/\d{3}$/.test(billNo));
          
          if (billNumbers.length === 0) {
            return `ARC/${new Date().getFullYear()}/001`;
          }
          
          billNumbers.sort();
          const latestBillNo = billNumbers[billNumbers.length - 1];
          const parts = latestBillNo.split('/');
          
          const year = new Date().getFullYear();
          let number = parseInt(parts[2]) + 1;
          
          return `ARC/${year}/${number.toString().padStart(3, '0')}`;
        } catch (e) {
          console.error('Error generating bill number:', e);
          return `ARC/${Date.now().toString().substr(-8)}`;
        }
      }
    };
    
    console.log('Fallback API service initialized');
  }
  
  // Start loading
  loadApiService();
})();
