<?php
session_start();

// Check for bill ID
$billId = $_GET['id'] ?? '';
if (empty($billId)) {
    header('Location: index.php');
    exit;
}

// Load bill data
$billsFile = __DIR__ . '/data/bills.json';
$bill = null;

if (file_exists($billsFile)) {
    $bills = json_decode(file_get_contents($billsFile), true);
    foreach ($bills as $b) {
        if ($b['id'] === $billId) {
            $bill = $b;
            break;
        }
    }
}

// If bill not found, redirect to dashboard
if (!$bill) {
    header('Location: index.php');
    exit;
}

// Check if in print mode
$printMode = isset($_GET['print']) && $_GET['print'] === 'true';
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bill <?= htmlspecialchars($bill['billNo']) ?> - Abhi Road Carrier</title>
    <link rel="stylesheet" href="css/bill.css">
    <?php if ($printMode): ?>
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 1000);
        };
    </script>
    <?php endif; ?>
</head>
<body>
    <div class="invoice">
        <div class="header">
            <div class="company-name">Abhi Road Carrier</div>
            <div class="tagline">Fleet Owner & Transport Contractor</div>
            <div class="contact-info">37/41 Nivrutti Complex A-Wing, Mumbai-Agra Road, Dwarka, Nashik-422001(MH)</div>
            <div class="contact-info">Email: abhiroadcarrier@gmail.com | Ph.No: 9373535944</div>
            <div class="pan-gstin">
                <div class="pan-number">PAN NO: AISPP9734A</div>
                <div class="gstin">GSTIN: 27AISPP9734A1ZU</div>
            </div>
        </div>
        
        <div class="bill-section">
            <div class="bill-to">
                <h3>TO M/S:</h3>
                <div class="bill-to-content"><?= htmlspecialchars($bill['toMs']) ?></div>
            </div>
            <div class="bill-details">
                <div class="bill-row">
                    <span class="bill-label">BILL NO:</span>
                    <span class="bill-value"><?= htmlspecialchars($bill['billNo']) ?></span>
                </div>
                <div class="bill-row">
                    <span class="bill-label">DATE:</span>
                    <span class="bill-value"><?= htmlspecialchars($bill['date']) ?></span>
                </div>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Sr.No</th>
                    <th>L.R.No</th>
                    <th>Date</th>
                    <th>Vehicle No.</th>
                    <th>Destination</th>
                    <th>Invoice No.</th>
                    <th>Weight</th>
                    <th>Rate</th>
                    <th>Extra</th>
                    <th>TOTAL</th>
                </tr>
            </thead>
            <tbody>
                <?php 
                // Filter items with vehicle numbers (valid items)
                $validItems = array_filter($bill['items'], function($item) {
                    return !empty($item['vehicleNo']);
                });
                
                // Add empty rows if needed
                $emptyRowsNeeded = max(5 - count($validItems), 0);
                
                // Display valid items
                foreach ($validItems as $item): 
                ?>
                <tr>
                    <td><?= htmlspecialchars($item['srNo']) ?></td>
                    <td><?= htmlspecialchars($item['lrNo']) ?></td>
                    <td><?= htmlspecialchars($item['date']) ?></td>
                    <td><?= htmlspecialchars($item['vehicleNo']) ?></td>
                    <td><?= htmlspecialchars($item['destination']) ?></td>
                    <td><?= htmlspecialchars($item['invoiceNo']) ?></td>
                    <td><?= htmlspecialchars($item['weight']) ?></td>
                    <td><?= htmlspecialchars($item['rate']) ?></td>
                    <td><?= htmlspecialchars(!empty($item['extra']) ? $item['extra'] : '-') ?></td>
                    <td><?= htmlspecialchars($item['total']) ?></td>
                </tr>
                <?php endforeach; ?>
                
                <!-- Add empty rows if needed -->
                <?php for ($i = 0; $i < $emptyRowsNeeded; $i++): ?>
                <tr class="empty-row">
                    <td><?= count($validItems) + $i + 1 ?></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
                <?php endfor; ?>
                
                <tr class="total-row">
                    <td colspan="8" style="text-align: right; font-weight: bold;">GRAND TOTAL</td>
                    <td></td>
                    <td class="total-cell"><?= htmlspecialchars($bill['grandTotal']) ?></td>
                </tr>
            </tbody>
        </table>
        
        <div class="total-section">
            <div class="in-words">
                <div class="in-words-label">Amount In Words:</div>
                <div class="in-words-content"><?= htmlspecialchars($bill['amountInWords']) ?></div>
            </div>
            <div class="total-amount">
                <div class="total-amount-label">TOTAL AMOUNT</div>
                <div class="total-amount-value">₹ <?= number_format((float)$bill['grandTotal'], 2, '.', ',') ?></div>
            </div>
        </div>
        
        <div class="footer">
            <div class="bank-details">
                <div class="bank-details-title">Bank Details:</div>
                <div class="bank-details-content">
                    Indian Overseas Bank<br>
                    Nashik Road Branch<br>
                    IFSC Code: IOBA0000776<br>
                    Account No: 077602000007057
                </div>
            </div>
            <div class="signatures">
                <div class="company-signature">
                    <div class="company-signature-line">For ABHI ROAD CARRIER</div>
                </div>
            </div>
        </div>
    </div>
    
    <?php if (!$printMode): ?>
    <div class="print-controls">
        <button onclick="window.print();">Print Bill</button>
        <button onclick="window.location.href = 'api/download_bill.php?id=<?= htmlspecialchars($billId) ?>'">Download PDF</button>
        <button onclick="window.location.href = 'index.php'">Back to Dashboard</button>
    </div>
    <?php endif; ?>
</body>
</html>
