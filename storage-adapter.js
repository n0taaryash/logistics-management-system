// This file provides a consistent interface for storage
// that works both locally and on Vercel

const fs = require('fs');
const path = require('path');
let kv;

// Try to import Vercel KV - will only work on Vercel environment
try {
  kv = require('@vercel/kv');
} catch (error) {
  console.log('Vercel KV not available, using local storage');
}

// Local file paths
const dataDir = path.join(__dirname, 'data');
const billsFile = path.join(dataDir, 'bills.json');

// Ensure data directory exists for local development
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir);
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

// Initialize bills file if it doesn't exist (local only)
if (!fs.existsSync(billsFile)) {
  try {
    fs.writeFileSync(billsFile, JSON.stringify([]));
  } catch (err) {
    console.error('Failed to initialize bills file:', err);
  }
}

// Determine if we're running on Vercel
const isVercel = process.env.VERCEL === '1';

// Storage adapter functions
const storage = {
  // Get all bills
  async getAllBills() {
    if (isVercel && kv) {
      // Use Vercel KV
      const bills = await kv.get('bills') || [];
      return bills;
    } else {
      // Use local file
      try {
        return JSON.parse(fs.readFileSync(billsFile));
      } catch (error) {
        console.error('Error reading bills file:', error);
        return [];
      }
    }
  },

  // Get bill by ID
  async getBillById(id) {
    const bills = await this.getAllBills();
    return bills.find(bill => bill.id === id);
  },

  // Save bill
  async saveBill(bill) {
    if (isVercel && kv) {
      // Use Vercel KV
      const bills = await this.getAllBills();
      bills.push(bill);
      await kv.set('bills', bills);
      return bill;
    } else {
      // Use local file
      try {
        const bills = await this.getAllBills();
        bills.push(bill);
        fs.writeFileSync(billsFile, JSON.stringify(bills, null, 2));
        return bill;
      } catch (error) {
        console.error('Error saving bill:', error);
        throw error;
      }
    }
  },

  // Update bill
  async updateBill(id, updatedBill) {
    if (isVercel && kv) {
      // Use Vercel KV
      const bills = await this.getAllBills();
      const billIndex = bills.findIndex(bill => bill.id === id);
      
      if (billIndex !== -1) {
        bills[billIndex] = updatedBill;
        await kv.set('bills', bills);
        return updatedBill;
      }
      return null;
    } else {
      // Use local file
      try {
        const bills = await this.getAllBills();
        const billIndex = bills.findIndex(bill => bill.id === id);
        
        if (billIndex !== -1) {
          bills[billIndex] = updatedBill;
          fs.writeFileSync(billsFile, JSON.stringify(bills, null, 2));
          return updatedBill;
        }
        return null;
      } catch (error) {
        console.error('Error updating bill:', error);
        throw error;
      }
    }
  },

  // Delete bill
  async deleteBill(id) {
    if (isVercel && kv) {
      // Use Vercel KV
      const bills = await this.getAllBills();
      const filteredBills = bills.filter(bill => bill.id !== id);
      
      if (filteredBills.length < bills.length) {
        await kv.set('bills', filteredBills);
        return true;
      }
      return false;
    } else {
      // Use local file
      try {
        const bills = await this.getAllBills();
        const filteredBills = bills.filter(bill => bill.id !== id);
        
        if (filteredBills.length < bills.length) {
          fs.writeFileSync(billsFile, JSON.stringify(filteredBills, null, 2));
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error deleting bill:', error);
        throw error;
      }
    }
  }
};

module.exports = storage;
