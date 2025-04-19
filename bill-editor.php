<?php
session_start();

// Check if ID is provided
$billId = $_GET['id'] ?? '';
$bill = null;

if (!empty($billId)) {
    // Load bill data
    $billsFile = __DIR__ . '/data/bills.json';
    
    if (file_exists($billsFile)) {
        $bills = json_decode(file_get_contents($billsFile), true);
        foreach ($bills as $b) {
            if ($b['id'] === $billId) {
                $bill = $b;
                break;
            }
        }
    }
}

// If bill not found and not creating new, redirect
if (!$bill && !empty($billId)) {
    header('Location: index.php?error=Bill+not+found');
    exit;
}

// Check if submit was pressed
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Process form submission
    try {
        // Collect form data
        $formData = [
            'id' => $billId ?: uniqid(),
            'toMs' => $_POST['toMs'],
            'billNo' => $_POST['billNo'],
            'date' => $_POST['date'],
            'items' => [],
            'grandTotal' => $_POST['grandTotal'],
            'amountInWords' => $_POST['amountInWords'],
            'createdAt' => date('c')
        ];
        
        // Process items
        $srNo = $_POST['srNo'] ?? [];
        $lrNo = $_POST['lrNo'] ?? [];
        $itemDate = $_POST['itemDate'] ?? [];
        $vehicleNo = $_POST['vehicleNo'] ?? [];
        $destination = $_POST['destination'] ?? [];
        $invoiceNo = $_POST['invoiceNo'] ?? [];
        $weight = $_POST['weight'] ?? [];
        $rate = $_POST['rate'] ?? [];
        $extra = $_POST['extra'] ?? [];
        $total = $_POST['total'] ?? [];
        
        // Create items array
        $count = count($srNo);
        for ($i = 0; $i < $count; $i++) {
            if (!empty($vehicleNo[$i])) {
                $formData['items'][] = [
                    'srNo' => $srNo[$i],
                    'lrNo' => $lrNo[$i],
                    'date' => $itemDate[$i],
                    'vehicleNo' => $vehicleNo[$i],
                    'destination' => $destination[$i],
                    'invoiceNo' => $invoiceNo[$i],
                    'weight' => $weight[$i],
                    'rate' => $rate[$i],
                    'extra' => $extra[$i],
                    'total' => $total[$i]
                ];
            }
        }
        
        // Ensure data directory exists
        $dataDir = __DIR__ . '/data';
        if (!is_dir($dataDir)) {
            mkdir($dataDir, 0755, true);
        }
        
        // Load existing bills
        $billsFile = "$dataDir/bills.json";
        $bills = [];
        
        if (file_exists($billsFile)) {
            $bills = json_decode(file_get_contents($billsFile), true) ?: [];
        }
        
        // Update or add bill
        $updated = false;
        foreach ($bills as $key => $existingBill) {
            if ($existingBill['id'] === $billId) {
                $bills[$key] = $formData;
                $updated = true;
                break;
            }
        }
        
        if (!$updated) {
            $bills[] = $formData;
        }
        
        // Save bills
        file_put_contents($billsFile, json_encode($bills, JSON_PRETTY_PRINT));
        
        // Redirect to view the bill
        header("Location: bill.php?id={$formData['id']}&success=1");
        exit;
    } catch (Exception $e) {
        $error = "Error: " . $e->getMessage();
    }
}

// Convert date format from DD.MM.YYYY to YYYY-MM-DD for input fields
function formatDateForInput($dateStr) {
    if (!$dateStr) return '';
    
    if (strpos($dateStr, '-') !== false) {
        // Already in YYYY-MM-DD format
        return $dateStr;
    }
    
    $parts = explode('.', $dateStr);
    if (count($parts) !== 3) return '';
    
    return $parts[2] . '-' . $parts[1] . '-' . $parts[0];
}

// Formatting for display
function formatDisplayDate($dateStr) {
    if (!$dateStr) return '';
    
    if (strpos($dateStr, '.') !== false) {
        // Already in DD.MM.YYYY format
        return $dateStr;
    }
    
    $parts = explode('-', $dateStr);
    if (count($parts) !== 3) return '';
    
    return $parts[2] . '.' . $parts[1] . '.' . $parts[0];
}

// Get settings
$settingsFile = __DIR__ . '/data/settings.json';
$checkedBy = 'ADMIN';
$preparedBy = 'ARC';

if (file_exists($settingsFile)) {
    $settings = json_decode(file_get_contents($settingsFile), true);
    if ($settings) {
        $checkedBy = $settings['checkedBy'] ?? $checkedBy;
        $preparedBy = $settings['preparedBy'] ?? $preparedBy;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $bill ? 'Edit' : 'Create' ?> Bill - Abhi Road Carrier</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/bill-form.css">
    <style>
        .error-message {
            background-color: #f8d7da;
            color: #721c24;
            padding: 10px;
            margin-bottom: 15px;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="sidebar">
            <div class="sidebar-header">
                <div class="company-name">Abhi Road Carrier</div>
                <div class="tagline">Fleet Owner & Transport Contractor</div>
            </div>
            <ul class="sidebar-menu">
                <li><a href="index.php"><span class="icon">📊</span> Dashboard</a></li>
                <li class="<?= $bill ? '' : 'active' ?>"><a href="bill-editor.php"><span class="icon">📄</span> Create Bill</a></li>
                <li><a href="settings.php"><span class="icon">⚙️</span> Settings</a></li>
            </ul>
        </div>

        <div class="main-content">
            <div class="header">
                <div class="page-title"><?= $bill ? 'Edit Bill' : 'Create New Bill' ?></div>
            </div>

            <?php if (isset($error)): ?>
            <div class="error-message"><?= htmlspecialchars($error) ?></div>
            <?php endif; ?>

            <div class="form-container">
                <form method="post" action="">
                    <div class="form-section">
                        <h2>Bill Information</h2>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="toMs">TO M/S:</label>
                                <input type="text" id="toMs" name="toMs" value="<?= htmlspecialchars($bill['toMs'] ?? '') ?>" required>
                            </div>
                            <div class="form-group">
                                <label for="billNo">BILL NO:</label>
                                <input type="text" id="billNo" name="billNo" value="<?= htmlspecialchars($bill['billNo'] ?? '') ?>" required>
                            </div>
                            <div class="form-group">
                                <label for="date">DATE:</label>
                                <input type="text" id="date" name="date" value="<?= htmlspecialchars($bill ? $bill['date'] : date('d.m.Y')) ?>" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="checkedBy">Checked By:</label>
                                <input type="text" id="checkedBy" name="checkedBy" value="<?= htmlspecialchars($bill['checkedBy'] ?? $checkedBy) ?>">
                            </div>
                            <div class="form-group">
                                <label for="preparedBy">Prepared By:</label>
                                <input type="text" id="preparedBy" name="preparedBy" value="<?= htmlspecialchars($bill['preparedBy'] ?? $preparedBy) ?>">
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h2>Bill Items</h2>
                        <table id="itemsTable">
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
                                    <th>Total</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="itemsTableBody">
                                <?php 
                                $items = $bill['items'] ?? [];
                                
                                // Ensure we have at least one item
                                if (empty($items)) {
                                    $items = [
                                        [
                                            'srNo' => 1,
                                            'lrNo' => '',
                                            'date' => date('d.m.Y'),
                                            'vehicleNo' => '',
                                            'destination' => '',
                                            'invoiceNo' => '',
                                            'weight' => '',
                                            'rate' => '',
                                            'extra' => '0',
                                            'total' => ''
                                        ]
                                    ];
                                }
                                
                                foreach ($items as $index => $item):
                                ?>
                                <tr>
                                    <td>
                                        <input type="hidden" name="srNo[]" value="<?= $index + 1 ?>">
                                        <?= $index + 1 ?>
                                    </td>
                                    <td><input type="text" name="lrNo[]" value="<?= htmlspecialchars($item['lrNo'] ?? '') ?>" required></td>
                                    <td><input type="text" name="itemDate[]" value="<?= htmlspecialchars($item['date'] ?? date('d.m.Y')) ?>" required></td>
                                    <td><input type="text" name="vehicleNo[]" value="<?= htmlspecialchars($item['vehicleNo'] ?? '') ?>" required></td>
                                    <td><input type="text" name="destination[]" value="<?= htmlspecialchars($item['destination'] ?? '') ?>" required></td>
                                    <td><input type="text" name="invoiceNo[]" value="<?= htmlspecialchars($item['invoiceNo'] ?? '') ?>" required></td>
                                    <td><input type="number" name="weight[]" step="0.01" value="<?= htmlspecialchars($item['weight'] ?? '') ?>" required class="calc-weight"></td>
                                    <td><input type="number" name="rate[]" value="<?= htmlspecialchars($item['rate'] ?? '') ?>" required class="calc-rate"></td>
                                    <td><input type="number" name="extra[]" value="<?= htmlspecialchars($item['extra'] ?? '0') ?>" class="calc-extra"></td>
                                    <td><input type="number" name="total[]" value="<?= htmlspecialchars($item['total'] ?? '') ?>" readonly class="item-total"></td>
                                    <td>
                                        <button type="button" class="remove-row">❌</button>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                        <button type="button" id="addRow" class="add-row-button">Add Row</button>
                    </div>

                    <div class="form-section">
                        <h2>Bill Total</h2>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="grandTotal">Grand Total:</label>
                                <input type="text" id="grandTotal" name="grandTotal" value="<?= htmlspecialchars($bill['grandTotal'] ?? '') ?>" readonly>
                            </div>
                            <div class="form-group">
                                <label for="amountInWords">Amount In Words:</label>
                                <input type="text" id="amountInWords" name="amountInWords" value="<?= htmlspecialchars($bill['amountInWords'] ?? '') ?>">
                            </div>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" id="cancelButton" class="cancel-button">Cancel</button>
                        <button type="submit" class="save-button"><?= $bill ? 'Update' : 'Create' ?> Bill</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const addRowButton = document.getElementById('addRow');
            const cancelButton = document.getElementById('cancelButton');
            const itemsTableBody = document.getElementById('itemsTableBody');
            
            // Add row event
            addRowButton.addEventListener('click', function() {
                const rowCount = itemsTableBody.rows.length;
                const newRow = document.createElement('tr');
                
                const today = new Date();
                const dateStr = today.getDate().toString().padStart(2, '0') + '.' + 
                               (today.getMonth() + 1).toString().padStart(2, '0') + '.' + 
                               today.getFullYear();
                
                newRow.innerHTML = `
                    <td>
                        <input type="hidden" name="srNo[]" value="${rowCount + 1}">
                        ${rowCount + 1}
                    </td>
                    <td><input type="text" name="lrNo[]" required></td>
                    <td><input type="text" name="itemDate[]" value="${dateStr}" required></td>
                    <td><input type="text" name="vehicleNo[]" required></td>
                    <td><input type="text" name="destination[]" required></td>
                    <td><input type="text" name="invoiceNo[]" required></td>
                    <td><input type="number" name="weight[]" step="0.01" required class="calc-weight"></td>
                    <td><input type="number" name="rate[]" required class="calc-rate"></td>
                    <td><input type="number" name="extra[]" value="0" class="calc-extra"></td>
                    <td><input type="number" name="total[]" readonly class="item-total"></td>
                    <td>
                        <button type="button" class="remove-row">❌</button>
                    </td>
                `;
                
                itemsTableBody.appendChild(newRow);
                attachCalculationEvents(newRow);
            });
            
            // Cancel button
            cancelButton.addEventListener('click', function() {
                window.location.href = 'index.php';
            });
            
            // Remove row event using event delegation
            itemsTableBody.addEventListener('click', function(e) {
                if (e.target.classList.contains('remove-row')) {
                    const row = e.target.closest('tr');
                    
                    if (itemsTableBody.rows.length > 1) {
                        row.remove();
                        
                        // Update row numbers
                        updateRowNumbers();
                        
                        // Recalculate grand total
                        calculateGrandTotal();
                    } else {
                        alert('Cannot remove the last row. At least one item is required.');
                    }
                }
            });
            
            // Calculation events for existing rows
            Array.from(itemsTableBody.rows).forEach(row => {
                attachCalculationEvents(row);
            });
            
            // Initialize grand total
            calculateGrandTotal();
            
            // Helper functions
            function attachCalculationEvents(row) {
                const weightInput = row.querySelector('.calc-weight');
                const rateInput = row.querySelector('.calc-rate');
                const extraInput = row.querySelector('.calc-extra');
                
                weightInput.addEventListener('input', () => calculateRowTotal(row));
                rateInput.addEventListener('input', () => calculateRowTotal(row));
                extraInput.addEventListener('input', () => calculateRowTotal(row));
            }
            
            function calculateRowTotal(row) {
                const weightInput = row.querySelector('.calc-weight');
                const rateInput = row.querySelector('.calc-rate');
                const extraInput = row.querySelector('.calc-extra');
                const totalInput = row.querySelector('.item-total');
                
                const weight = parseFloat(weightInput.value) || 0;
                const rate = parseFloat(rateInput.value) || 0;
                const extra = parseFloat(extraInput.value) || 0;
                
                const total = (weight * rate) + extra;
                totalInput.value = total.toFixed(2);
                
                // Update grand total
                calculateGrandTotal();
            }
            
            function calculateGrandTotal() {
                let grandTotal = 0;
                
                const totalInputs = document.querySelectorAll('.item-total');
                totalInputs.forEach(input => {
                    grandTotal += parseFloat(input.value) || 0;
                });
                
                document.getElementById('grandTotal').value = grandTotal.toFixed(2);
                document.getElementById('amountInWords').value = numberToWords(grandTotal);
            }
            
            function updateRowNumbers() {
                const rows = itemsTableBody.rows;
                for (let i = 0; i < rows.length; i++) {
                    rows[i].cells[0].textContent = i + 1;
                    rows[i].querySelector('input[name="srNo[]"]').value = i + 1;
                }
            }
            
            // Convert number to words
            function numberToWords(amount) {
                if (!amount) return '';
                
                const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
                const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
                const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
                
                function convert(num) {
                    if (num < 10) return ones[num];
                    if (num < 20) return teens[num - 10];
                    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
                    if (num < 1000) return ones[Math.floor(num / 100)] + ' HUNDRED' + (num % 100 ? ' ' + convert(num % 100) : '');
                    if (num < 100000) return convert(Math.floor(num / 1000)) + ' THOUSAND' + (num % 1000 ? ' ' + convert(num % 1000) : '');
                    if (num < 10000000) return convert(Math.floor(num / 100000)) + ' LAKH' + (num % 100000 ? ' ' + convert(num % 100000) : '');
                    return convert(Math.floor(num / 10000000)) + ' CRORE' + (num % 10000000 ? ' ' + convert(num % 10000000) : '');
                }
                
                const rupees = Math.floor(amount);
                const paise = Math.round((amount - rupees) * 100);
                
                let result = convert(rupees);
                
                if (paise > 0) {
                    result += ' AND PAISE ' + convert(paise);
                }
                
                return result + ' ONLY';
            }
        });
    </script>
</body>
</html>
