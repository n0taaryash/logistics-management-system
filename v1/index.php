<?php
// Main dashboard page
session_start();

// Check if on Vercel and adjust data paths
$isVercel = getenv('VERCEL') === '1';
$dataPath = $isVercel ? '/tmp/data' : __DIR__ . '/data';
$billsFile = $dataPath . '/bills.json';

// Create data directory if it doesn't exist
if (!is_dir($dataPath) && !$isVercel) {
    mkdir($dataPath, 0755, true);
}

// Load bills data
$bills = [];
if (file_exists($billsFile)) {
    $bills = json_decode(file_get_contents($billsFile), true) ?? [];
}

// Sort bills by date (newest first)
if (!empty($bills)) {
    usort($bills, function($a, $b) {
        return strtotime($b['createdAt'] ?? '0') - strtotime($a['createdAt'] ?? '0');
    });
}

// Calculate statistics
$totalBills = count($bills);
$totalAmount = array_reduce($bills, function($sum, $bill) {
    return $sum + floatval($bill['grandTotal'] ?? 0);
}, 0);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abhi Road Carrier - Logistics Management</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        /* Inline CSS as fallback */
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f7fa;
        }
        .dashboard {
            display: flex;
            min-height: 100vh;
        }
        .sidebar {
            width: 250px;
            background-color: #2c3e50;
            color: white;
            padding: 20px 0;
        }
        .main-content {
            flex: 1;
            padding: 20px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        .page-title {
            font-size: 24px;
            font-weight: 600;
            color: #2c3e50;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
        }
        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f0f4f8;
        }
        .action-button {
            margin: 0 3px;
            padding: 5px 8px;
            border: none;
            border-radius: 3px;
            color: white;
            cursor: pointer;
        }
        .view-button { background-color: #3498db; }
        .edit-button { background-color: #f39c12; }
        .delete-button { background-color: #e74c3c; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="sidebar">
            <div style="padding: 0 20px 20px; border-bottom: 1px solid #34495e; margin-bottom: 20px;">
                <div style="font-size: 22px; font-weight: 700; margin-bottom: 5px;">Abhi Road Carrier</div>
                <div style="font-size: 12px; color: #3498db;">Fleet Owner & Transport Contractor</div>
            </div>
            <ul style="list-style: none; padding: 0; margin: 0;">
                <li style="padding: 10px 20px; background-color: #34495e;"><a href="index.php" style="color: white; text-decoration: none;">📊 Dashboard</a></li>
                <li style="padding: 10px 20px;"><a href="bill-editor.php" style="color: white; text-decoration: none;">📄 Create Bill</a></li>
                <li style="padding: 10px 20px;"><a href="settings.php" style="color: white; text-decoration: none;">⚙️ Settings</a></li>
            </ul>
        </div>

        <div class="main-content">
            <div class="header">
                <div class="page-title">Dashboard</div>
            </div>
            
            <?php if (isset($_GET['success'])): ?>
            <div style="background-color: #d4edda; color: #155724; padding: 10px; margin-bottom: 15px; border-radius: 4px;">
                <?php 
                switch ($_GET['success']) {
                    case 'delete':
                        echo 'Bill deleted successfully!';
                        break;
                    case 'create':
                        echo 'Bill created successfully!';
                        break;
                    case 'update':
                        echo 'Bill updated successfully!';
                        break;
                    default:
                        echo 'Operation completed successfully!';
                }
                ?>
            </div>
            <?php endif; ?>
            
            <?php if (isset($_GET['error'])): ?>
            <div style="background-color: #f8d7da; color: #721c24; padding: 10px; margin-bottom: 15px; border-radius: 4px;">
                <?= htmlspecialchars($_GET['error']) ?>
            </div>
            <?php endif; ?>

            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px;">
                <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); text-align: center;">
                    <div style="font-size: 28px; font-weight: 700; color: #3498db; margin-bottom: 5px;"><?= $totalBills ?></div>
                    <div style="font-size: 14px; color: #7f8c8d;">Total Bills</div>
                </div>
                <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); text-align: center;">
                    <div style="font-size: 28px; font-weight: 700; color: #3498db; margin-bottom: 5px;">₹ <?= number_format($totalAmount, 2, '.', ',') ?></div>
                    <div style="font-size: 14px; color: #7f8c8d;">Total Revenue</div>
                </div>
            </div>

            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <input type="text" id="searchInput" placeholder="Search bills..." style="flex: 1; padding: 10px; border: 1px solid #dce4ec; border-radius: 4px; font-size: 14px;">
                <button id="searchButton" style="padding: 10px 15px; border: none; border-radius: 4px; background-color: #2c3e50; color: white; font-weight: 600; cursor: pointer;">Search</button>
                <button onclick="window.location.href='bill-editor.php'" style="padding: 10px 15px; border: none; border-radius: 4px; background-color: #3498db; color: white; font-weight: 600; cursor: pointer;">Create New Bill</button>
            </div>

            <div style="background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); overflow: hidden;">
                <table>
                    <thead>
                        <tr>
                            <th>Bill No.</th>
                            <th>Date</th>
                            <th>Client</th>
                            <th>Amount</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="billsTableBody">
                        <?php if (count($bills) === 0): ?>
                        <tr>
                            <td colspan="5" style="text-align: center; padding: 30px;">
                                No bills found. Create your first bill!
                            </td>
                        </tr>
                        <?php else: ?>
                            <?php foreach ($bills as $bill): ?>
                            <tr>
                                <td><?= htmlspecialchars($bill['billNo']) ?></td>
                                <td><?= htmlspecialchars($bill['date']) ?></td>
                                <td><?= htmlspecialchars($bill['toMs']) ?></td>
                                <td>₹ <?= number_format((float)$bill['grandTotal'], 2, '.', ',') ?></td>
                                <td>
                                    <button class="action-button view-button" onclick="window.location.href='bill.php?id=<?= htmlspecialchars($bill['id']) ?>'">View</button>
                                    <button class="action-button edit-button" onclick="window.location.href='bill-editor.php?id=<?= htmlspecialchars($bill['id']) ?>'">Edit</button>
                                    <button class="action-button delete-button" onclick="confirmDelete('<?= htmlspecialchars($bill['id']) ?>', '<?= htmlspecialchars($bill['billNo']) ?>')">Delete</button>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div id="deleteModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1000;">
        <div style="background-color: white; width: 90%; max-width: 500px; margin: 100px auto; padding: 20px; border-radius: 8px; box-shadow: 0 0 20px rgba(0,0,0,0.3);">
            <div style="font-size: 20px; margin-bottom: 15px; color: #e74c3c;">Confirm Deletion</div>
            <p>Are you sure you want to delete bill <strong id="billNoToDelete"></strong>?</p>
            <p>This action cannot be undone!</p>
            <div style="display: flex; justify-content: flex-end; margin-top: 20px; gap: 10px;">
                <button onclick="hideModal()" style="padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background-color: #7f8c8d; color: white;">Cancel</button>
                <button id="confirmDeleteButton" style="padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background-color: #e74c3c; color: white;">Delete Bill</button>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const searchInput = document.getElementById('searchInput');
            const searchButton = document.getElementById('searchButton');
            const billsTableBody = document.getElementById('billsTableBody');
            const originalRows = Array.from(billsTableBody.rows);
            
            // Search functionality
            searchButton.addEventListener('click', function() {
                const searchTerm = searchInput.value.toLowerCase();
                const filteredRows = originalRows.filter(row => {
                    const billNo = row.cells[0].textContent.toLowerCase();
                    const client = row.cells[2].textContent.toLowerCase();
                    return billNo.includes(searchTerm) || client.includes(searchTerm);
                });
                
                // Update table
                billsTableBody.innerHTML = '';
                if (filteredRows.length === 0) {
                    const noResultsRow = document.createElement('tr');
                    noResultsRow.innerHTML = `
                        <td colspan="5" style="text-align: center; padding: 30px;">
                            No bills matching "${searchInput.value}" found.
                        </td>
                    `;
                    billsTableBody.appendChild(noResultsRow);
                } else {
                    filteredRows.forEach(row => {
                        billsTableBody.appendChild(row);
                    });
                }
            });
            
            // Reset search on empty search box
            searchInput.addEventListener('input', function() {
                if (this.value === '') {
                    billsTableBody.innerHTML = '';
                    originalRows.forEach(row => {
                        billsTableBody.appendChild(row);
                    });
                }
            });
            
            // Close success message after a few seconds
            const successMessage = document.querySelector('.success-message');
            if (successMessage) {
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 5000);
            }
        });
        
        // Delete confirmation
        let billIdToDelete = '';
        
        function confirmDelete(billId, billNo) {
            document.getElementById('billNoToDelete').textContent = billNo;
            billIdToDelete = billId;
            document.getElementById('deleteModal').style.display = 'block';
            
            // Set action for confirm button
            document.getElementById('confirmDeleteButton').onclick = function() {
                window.location.href = `api/delete_bill.php?id=${billIdToDelete}&redirect=1`;
            };
        }
        
        function hideModal() {
            document.getElementById('deleteModal').style.display = 'none';
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('deleteModal');
            if (event.target === modal) {
                hideModal();
            }
        }
    </script>
</body>
</html>
