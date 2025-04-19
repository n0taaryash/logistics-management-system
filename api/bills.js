// Serverless API endpoint for bills

// Import path and fs for local file access (only used outside of Vercel)
const fs = require('fs');
const path = require('path');

// In-memory storage for Vercel
let inMemoryBills = [];

// Get bills data
async function getBills() {
  if (process.env.VERCEL) {
    return inMemoryBills;
  } else {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      const billsFile = path.join(dataDir, 'bills.json');
      
      if (fs.existsSync(billsFile)) {
        const data = fs.readFileSync(billsFile, 'utf8');
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Error reading bills:', error);
      return [];
    }
  }
}

// Save bills data
async function saveBills(bills) {
  if (process.env.VERCEL) {
    inMemoryBills = bills;
  } else {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      const billsFile = path.join(dataDir, 'bills.json');
      
      // Ensure data directory exists
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      fs.writeFileSync(billsFile, JSON.stringify(bills, null, 2));
    } catch (error) {
      console.error('Error saving bills:', error);
      throw error;
    }
  }
}

// Parse request body from raw stream
async function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        resolve({});
      }
    });
  });
}

// Handle CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
}

// Main handler function
module.exports = async (req, res) => {
  // Set CORS headers
  setCorsHeaders(res);
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const url = req.url;
    const idMatch = url.match(/\/api\/bills\/([^\/]+)/);
    const id = idMatch ? idMatch[1] : null;
    
    // GET /api/bills
    if (req.method === 'GET' && !id) {
      const bills = await getBills();
      return res.json(bills);
    }
    
    // GET /api/bills/:id
    if (req.method === 'GET' && id) {
      const bills = await getBills();
      const bill = bills.find(b => b.id === id);
      
      if (!bill) {
        return res.status(404).json({ error: 'Bill not found' });
      }
      
      return res.json(bill);
    }
    
    // POST /api/bills
    if (req.method === 'POST') {
      const newBill = await parseBody(req);
      const bills = await getBills();
      
      // Add ID and timestamp
      if (!newBill.id) {
        newBill.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
      }
      
      if (!newBill.createdAt) {
        newBill.createdAt = new Date().toISOString();
      }
      
      bills.push(newBill);
      await saveBills(bills);
      
      return res.status(201).json(newBill);
    }
    
    // PUT /api/bills/:id
    if (req.method === 'PUT' && id) {
      const updatedBill = await parseBody(req);
      const bills = await getBills();
      const index = bills.findIndex(b => b.id === id);
      
      if (index === -1) {
        return res.status(404).json({ error: 'Bill not found' });
      }
      
      // Preserve ID
      updatedBill.id = id;
      bills[index] = updatedBill;
      
      await saveBills(bills);
      return res.json(updatedBill);
    }
    
    // DELETE /api/bills/:id
    if (req.method === 'DELETE' && id) {
      const bills = await getBills();
      const filteredBills = bills.filter(b => b.id !== id);
      
      if (filteredBills.length === bills.length) {
        return res.status(404).json({ error: 'Bill not found' });
      }
      
      await saveBills(filteredBills);
      return res.json({ message: 'Bill deleted successfully' });
    }
    
    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
