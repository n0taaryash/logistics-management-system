const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const archiver = require('archiver');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/')));

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const billsFile = path.join(dataDir, 'bills.json');

// Initialize bills file if it doesn't exist
if (!fs.existsSync(billsFile)) {
    fs.writeFileSync(billsFile, JSON.stringify([]));
}

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
}

// Add multer for file uploads
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, imagesDir);
    },
    filename: function(req, file, cb) {
        // Keep original filenames for signature and stamp
        if (file.fieldname === 'signature') {
            cb(null, 'signature.png');
        } else if (file.fieldname === 'stamp') {
            cb(null, 'company-stamp.png');
        } else {
            cb(null, file.originalname);
        }
    }
});
const upload = multer({ storage: storage });

// API to upload signature and stamp images
app.post('/api/upload-images', upload.fields([
    { name: 'signature', maxCount: 1 },
    { name: 'stamp', maxCount: 1 }
]), (req, res) => {
    try {
        const files = req.files;
        const response = {
            message: 'Files uploaded successfully',
            files: {}
        };
        
        if (files.signature) {
            response.files.signature = 'signature.png';
        }
        
        if (files.stamp) {
            response.files.stamp = 'company-stamp.png';
        }
        
        res.json(response);
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ error: 'Failed to upload images' });
    }
});

// API to check if signature and stamp exist
app.get('/api/check-images', (req, res) => {
    try {
        const signaturePath = path.join(imagesDir, 'signature.png');
        const stampPath = path.join(imagesDir, 'company-stamp.png');
        
        const response = {
            signature: fs.existsSync(signaturePath),
            stamp: fs.existsSync(stampPath)
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error checking images:', error);
        res.status(500).json({ error: 'Failed to check images' });
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API to get all bills
app.get('/api/bills', (req, res) => {
    try {
        const bills = JSON.parse(fs.readFileSync(billsFile));
        res.json(bills);
    } catch (error) {
        console.error('Error reading bills file:', error);
        res.status(500).json({ error: 'Failed to read bills' });
    }
});

// API to get a single bill by ID
app.get('/api/bills/:id', (req, res) => {
    try {
        const bills = JSON.parse(fs.readFileSync(billsFile));
        const bill = bills.find(b => b.id === req.params.id);
        
        if (bill) {
            res.json(bill);
        } else {
            res.status(404).json({ error: 'Bill not found' });
        }
    } catch (error) {
        console.error('Error reading bill:', error);
        res.status(500).json({ error: 'Failed to read bill' });
    }
});

// API to create a new bill
app.post('/api/bills', (req, res) => {
    try {
        const bills = JSON.parse(fs.readFileSync(billsFile));
        const newBill = req.body;
        
        // Add timestamp if not provided
        if (!newBill.createdAt) {
            newBill.createdAt = new Date().toISOString();
        }
        
        // Add unique ID if not provided
        if (!newBill.id) {
            newBill.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
        }
        
        // Set default checked by and prepared by if not provided
        if (!newBill.checkedBy) {
            newBill.checkedBy = 'ADMIN';
        }
        
        if (!newBill.preparedBy) {
            newBill.preparedBy = 'ARC';
        }
        
        bills.push(newBill);
        fs.writeFileSync(billsFile, JSON.stringify(bills, null, 2));
        
        res.status(201).json(newBill);
    } catch (error) {
        console.error('Error saving bill:', error);
        res.status(500).json({ error: 'Failed to save bill' });
    }
});

// API to update a bill
app.put('/api/bills/:id', (req, res) => {
    try {
        const bills = JSON.parse(fs.readFileSync(billsFile));
        const billIndex = bills.findIndex(b => b.id === req.params.id);
        
        if (billIndex !== -1) {
            const updatedBill = req.body;
            updatedBill.id = req.params.id; // Ensure ID remains the same
            
            bills[billIndex] = updatedBill;
            fs.writeFileSync(billsFile, JSON.stringify(bills, null, 2));
            
            res.json(updatedBill);
        } else {
            res.status(404).json({ error: 'Bill not found' });
        }
    } catch (error) {
        console.error('Error updating bill:', error);
        res.status(500).json({ error: 'Failed to update bill' });
    }
});

// API to delete a bill
app.delete('/api/bills/:id', (req, res) => {
    try {
        const bills = JSON.parse(fs.readFileSync(billsFile));
        const filteredBills = bills.filter(b => b.id !== req.params.id);
        
        if (filteredBills.length < bills.length) {
            fs.writeFileSync(billsFile, JSON.stringify(filteredBills, null, 2));
            res.json({ message: 'Bill deleted successfully' });
        } else {
            res.status(404).json({ error: 'Bill not found' });
        }
    } catch (error) {
        console.error('Error deleting bill:', error);
        res.status(500).json({ error: 'Failed to delete bill' });
    }
});

// API to download a single bill as PDF
app.get('/api/bills/:id/download', (req, res) => {
    try {
        const bills = JSON.parse(fs.readFileSync(billsFile));
        const bill = bills.find(b => b.id === req.params.id);
        
        if (!bill) {
            return res.status(404).json({ error: 'Bill not found' });
        }
        
        // Create a PDF document
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        
        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Bill-${bill.billNo.replace(/\//g, '-')}.pdf`);
        
        // Pipe the PDF document to the response
        doc.pipe(res);
        
        // Add content to the PDF
        generateBillPDF(doc, bill);
        
        // Finalize the PDF
        doc.end();
    } catch (error) {
        console.error('Error downloading bill:', error);
        res.status(500).json({ error: 'Failed to download bill' });
    }
});

// API to download multiple bills as ZIP
app.post('/api/bills/download', (req, res) => {
    try {
        const billIds = req.body.ids || [];
        const bills = JSON.parse(fs.readFileSync(billsFile));
        const selectedBills = bills.filter(b => billIds.includes(b.id));
        
        if (selectedBills.length === 0) {
            return res.status(404).json({ error: 'No valid bills found' });
        }
        
        // Set response headers for ZIP download
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=AbhiRoadCarrier-Bills.zip`);
        
        // Create a zip archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression level
        });
        
        // Pipe the archive to the response
        archive.pipe(res);
        
        // Add each bill as a PDF to the archive
        selectedBills.forEach(bill => {
            const pdfDoc = new PDFDocument({ size: 'A4', margin: 50 });
            const pdfFileName = `Bill-${bill.billNo.replace(/\//g, '-')}.pdf`;
            
            // Add content to the PDF
            generateBillPDF(pdfDoc, bill);
            
            // Add the PDF to the archive
            archive.append(pdfDoc, { name: pdfFileName });
            
            // Finalize the PDF
            pdfDoc.end();
        });
        
        // Finalize the archive
        archive.finalize();
    } catch (error) {
        console.error('Error downloading bills:', error);
        res.status(500).json({ error: 'Failed to download bills' });
    }
});

// Function to generate PDF content for a bill
function generateBillPDF(doc, bill) {
    // Set PDF metadata
    doc.info.Title = `Bill - ${bill.billNo}`;
    doc.info.Author = 'Abhi Road Carrier';
    
    // Add company header
    doc.fontSize(20).font('Helvetica-Bold').text('Abhi Road Carrier', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('Fleet Owner & Transport Contractor', { align: 'center' });
    doc.fontSize(10).text('37/41 Nivrutti Complex A-Wing, Mumbai-Agra Road, Dwarka, Nashik-422001(MH)', { align: 'center' });
    doc.fontSize(10).text('Email: abhiroadcarrier@gmail.com | Ph.No: 9373535944', { align: 'center' });
    
    // Add company stamp image
    try {
        const stampPath = path.join(__dirname, 'images', 'company-stamp.png');
        if (fs.existsSync(stampPath)) {
            doc.image(stampPath, 450, 110, { width: 100 });
        }
    } catch (error) {
        console.error('Error adding stamp image:', error);
    }
    
    // Add signature image
    try {
        const signaturePath = path.join(__dirname, 'images', 'signature.png');
        if (fs.existsSync(signaturePath)) {
            // We'll use this image later near the signature line
            doc.image(signaturePath, 450, 680, { width: 80 });
        }
    } catch (error) {
        console.error('Error adding signature image:', error);
    }
    
    doc.moveDown(0.5);
    // Draw header line
    doc.lineWidth(2)
       .lineCap('butt')
       .strokeColor('#2c3e50')
       .moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke();
    
    doc.moveDown(1);
    
    // PAN and GSTIN in a box
    const panGstY = doc.y;
    doc.rect(50, panGstY, 250, 40).fillAndStroke('#f0f4f8', '#e0e5ea');
    doc.rect(300, panGstY, 250, 40).fillAndStroke('#f0f4f8', '#e0e5ea');
    
    doc.fillColor('#000000')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('PAN NO: AISPP9734A', 65, panGstY + 15);
       
    doc.fillColor('#000000')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('GSTIN: 27AISPP9734A1ZU', 315, panGstY + 15);
    
    doc.moveDown(2);
    
    // Bill details section
    const billDetailsY = doc.y;
    
    // Bill to section
    doc.rect(50, billDetailsY, 300, 80).fillAndStroke('#f0f4f8', '#e0e5ea');
    doc.fillColor('#000000')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('TO M/S:', 65, billDetailsY + 10);
       
    doc.rect(65, billDetailsY + 30, 270, 40).fillAndStroke('#ffffff', '#e0e5ea');
    doc.fillColor('#000000')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text(bill.toMs, 75, billDetailsY + 45);
    
    // Bill info section
    doc.rect(370, billDetailsY, 180, 80).fillAndStroke('#f0f4f8', '#e0e5ea');
    
    // Bill No.
    doc.fillColor('#000000')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('BILL NO:', 385, billDetailsY + 15);
       
    doc.fillColor('#3498db')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(bill.billNo, 460, billDetailsY + 15);
    
    // Date
    doc.fillColor('#000000')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('DATE:', 385, billDetailsY + 40);
       
    doc.fillColor('#3498db')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(bill.date, 460, billDetailsY + 40);
    
    doc.moveDown(4);
    
    // Items table
    const tableTop = billDetailsY + 100;
    const itemsPerPage = 10;
    let itemCount = 0;
    let currentPage = 1;
    
    // Draw table background
    doc.rect(50, tableTop, 500, 25).fillAndStroke('#2c3e50', '#2c3e50');
    
    // Table headers
    doc.fillColor('#ffffff')
       .fontSize(9)
       .font('Helvetica-Bold');
    
    const colWidths = [30, 40, 50, 65, 65, 60, 35, 35, 30, 40];
    const colPositions = [50];
    let runningPos = 50;
    
    // Calculate column positions
    for (let i = 0; i < colWidths.length; i++) {
        runningPos += colWidths[i];
        colPositions.push(runningPos);
    }
    
    const headers = ['Sr.No', 'L.R.No', 'Date', 'Vehicle No.', 'Destination', 'Invoice No.', 'Weight', 'Rate', 'Extra', 'TOTAL'];
    
    headers.forEach((header, i) => {
        doc.text(header, colPositions[i] + 5, tableTop + 8, { width: colWidths[i] - 10, align: 'center' });
    });
    
    // Draw vertical lines for headers
    for (let i = 0; i < colPositions.length; i++) {
        doc.lineCap('butt')
           .strokeColor('#ffffff')
           .moveTo(colPositions[i], tableTop)
           .lineTo(colPositions[i], tableTop + 25)
           .stroke();
    }
    
    // Table rows
    doc.fillColor('#000000').fontSize(9).font('Helvetica');
    let y = tableTop + 25;
    
    // Filter out empty rows
    const validItems = bill.items.filter(item => item.lrNo && item.vehicleNo);
    const emptyRowsNeeded = 5 - validItems.length;
    
    // Add valid items
    validItems.forEach((item, i) => {
        // Alternate row background
        if (i % 2 === 0) {
            doc.rect(50, y, 500, 20).fillAndStroke('#f5f7fa', '#e0e5ea');
        } else {
            doc.rect(50, y, 500, 20).fillAndStroke('#ffffff', '#e0e5ea');
        }
        
        // Draw item data
        doc.fillColor('#000000');
        doc.text(item.srNo.toString(), colPositions[0] + 5, y + 5, { width: colWidths[0] - 10, align: 'center' });
        doc.text(item.lrNo, colPositions[1] + 5, y + 5, { width: colWidths[1] - 10, align: 'center' });
        doc.text(item.date, colPositions[2] + 5, y + 5, { width: colWidths[2] - 10, align: 'center' });
        doc.text(item.vehicleNo, colPositions[3] + 5, y + 5, { width: colWidths[3] - 10, align: 'center' });
        doc.text(item.destination, colPositions[4] + 5, y + 5, { width: colWidths[4] - 10, align: 'center' });
        doc.text(item.invoiceNo, colPositions[5] + 5, y + 5, { width: colWidths[5] - 10, align: 'center' });
        doc.text(item.weight, colPositions[6] + 5, y + 5, { width: colWidths[6] - 10, align: 'center' });
        doc.text(item.rate, colPositions[7] + 5, y + 5, { width: colWidths[7] - 10, align: 'center' });
        doc.text(item.extra || '-', colPositions[8] + 5, y + 5, { width: colWidths[8] - 10, align: 'center' });
        doc.text(item.total, colPositions[9] + 5, y + 5, { width: colWidths[9] - 10, align: 'center' });
        
        // Draw vertical borders
        for (let i = 0; i < colPositions.length; i++) {
            doc.lineCap('butt')
               .strokeColor('#e0e5ea')
               .moveTo(colPositions[i], y)
               .lineTo(colPositions[i], y + 20)
               .stroke();
        }
        
        y += 20;
    });
    
    // Add empty rows to reach minimum 5 rows
    for (let i = 0; i < emptyRowsNeeded; i++) {
        // Alternate row background
        if ((validItems.length + i) % 2 === 0) {
            doc.rect(50, y, 500, 20).fillAndStroke('#f5f7fa', '#e0e5ea');
        } else {
            doc.rect(50, y, 500, 20).fillAndStroke('#ffffff', '#e0e5ea');
        }
        
        // Add row number only
        doc.fillColor('#000000');
        doc.text((validItems.length + i + 1).toString(), colPositions[0] + 5, y + 5, { width: colWidths[0] - 10, align: 'center' });
        
        // Draw vertical borders
        for (let i = 0; i < colPositions.length; i++) {
            doc.lineCap('butt')
               .strokeColor('#e0e5ea')
               .moveTo(colPositions[i], y)
               .lineTo(colPositions[i], y + 20)
               .stroke();
        }
        
        y += 20;
    }
    
    // Total row
    doc.rect(50, y, 430, 25).fillAndStroke('#f0f4f8', '#2c3e50');
    doc.rect(480, y, 70).fillAndStroke('#f0f4f8', '#2c3e50');
    
    doc.fillColor('#000000')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('GRAND TOTAL', 350, y + 8, { align: 'right' });
       
    doc.fillColor('#2c3e50')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(bill.grandTotal, 485, y + 8, { width: 60, align: 'center' });
    
    y += 35;
    
    // Amount in words section
    doc.rect(50, y, 320, 60).fillAndStroke('#f0f4f8', '#e0e5ea');
    doc.fillColor('#000000')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('Amount In Words:', 60, y + 10);
       
    doc.fillColor('#3498db')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text(bill.amountInWords, 60, y + 30, { width: 300 });
    
    // Total amount box
    doc.rect(390, y, 160, 60).fillAndStroke('#2c3e50', '#2c3e50');
    doc.fillColor('#ffffff')
       .fontSize(10)
       .font('Helvetica')
       .text('TOTAL AMOUNT', 420, y + 15, { align: 'center' });
       
    doc.fillColor('#ffffff')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text(`₹ ${Number(bill.grandTotal).toLocaleString('en-IN')}`, 420, y + 35, { align: 'center' });
    
    y += 80;
    
    // Bank details
    doc.rect(50, y, 250, 100).fillAndStroke('#f0f4f8', '#e0e5ea');
    doc.fillColor('#2c3e50')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('Bank Details:', 60, y + 10);
       
    doc.fillColor('#000000')
       .fontSize(9)
       .font('Helvetica')
       .text('Indian Overseas Bank', 60, y + 30)
       .text('Nashik Road Branch', 60, y + 45)
       .text('IFSC Code: IOBA0000776', 60, y + 60)
       .text('Account No: 077602000007057', 60, y + 75);
    
    // Signatures section - NOT for printed PDFs
    // These won't be visible when printed because we're making them very light in color
    // They will be visible in the digital preview only
    if (bill.checkedBy || bill.preparedBy) {
        doc.fillColor('#f0f4f8')  // Using very light color that won't print
           .fontSize(9)
           .font('Helvetica')
           .text(`Checked By: ${bill.checkedBy || 'ADMIN'}`, 320, y + 30)
           .text(`Prepared By: ${bill.preparedBy || 'ARC'}`, 320, y + 60);
    } else {
        // Fallback if not specified in the bill
        doc.fillColor('#f0f4f8')  // Using very light color that won't print
           .fontSize(9)
           .font('Helvetica')
           .text('Checked By: ADMIN', 320, y + 30)
           .text('Prepared By: ARC', 320, y + 60);
    }
    
    // Company signature
    doc.fillColor('#2c3e50')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('For ABHI ROAD CARRIER', 460, y + 85, { align: 'right' });
}

// Also add a new API endpoint to get bill settings
app.get('/api/bill-settings', (req, res) => {
    try {
        // In a real app, these would come from a database
        // For now, we'll use hardcoded defaults that should match what's in localStorage
        const settings = {
            checkedBy: 'ADMIN',
            preparedBy: 'ARC'
        };
        
        res.json(settings);
    } catch (error) {
        console.error('Error retrieving bill settings:', error);
        res.status(500).json({ error: 'Failed to retrieve bill settings' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
