<?php
// Main dashboard page
session_start();

// Load bills data
$billsFile = __DIR__ . '/data/bills.json';
$bills = [];

if (file_exists($billsFile)) {
    $bills = json_decode(file_get_contents($billsFile), true) ?? [];
}

// Sort bills by date (newest first)
usort($bills, function($a, $b) {
    return strtotime($b['createdAt'] ?? '0') - strtotime($a['createdAt'] ?? '0');
});

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
        .action-button {
            margin: 0 3px;
            padding: 5px 8px;
            border: none;
            border-radius: 3px;
            color: white;
            font-size: 12px;
            cursor: pointer;
        }
        .view-button { background-color: #3498db; }
        .edit-button { background-color: #f39c12; }
        .delete-button { background-color: #e74c3c; }
        .success-message {
            background-color: #d4edda;
            color: #155724;
            padding: 10px;
            margin-bottom: 15px;
            border-radius: 4px;
        }
        .error-message {
            background-color: #f8d7da;
            color: #721c24;
            padding: 10px;
            margin-bottom: 15px;
            border-radius: 4px;
        }
        .confirmation-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            z-index: 1000;
        }
        .modal-content {
            background-color: white;
            width: 90%;
            max-width: 500px;
            margin: 100px auto;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0,0,0,0.3);
        }
        .modal-title {
            font-size: 20px;
            margin-bottom: 15px;
            color: #e74c3c;
        }
        .modal-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
            gap: 10px;
        }
        .modal-actions button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            color: white;
        }
        .cancel-button {
            background-color: #7f8c8d;
        }
        .confirm-button {
            background-color: #e74c3c;
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
                <li class="active"><a href="index.php"><span class="icon">📊</span> Dashboard</a></li>
                <li><a href="bill-editor.php"><span class="icon">📄</span> Create Bill</a></li>
                <li><a href="settings.php"><span class="icon">⚙️</span> Settings</a></li>
            </ul>
        </div>

        <div class="main-content">
            <div class="header">
                <div class="page-title">Dashboard</div>
            </div>
            
            <?php if (isset($_GET['success'])): ?>
            <div class="success-message">
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
            <div class="error-message"><?= htmlspecialchars($_GET['error']) ?></div>
            <?php endif; ?>

            <div class="dashboard-stats">
                <div class="stat-card">
                    <div class="stat-value"><?= $totalBills ?></div>
                    <div class="stat-label">Total Bills</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">₹ <?= number_format($totalAmount, 2, '.', ',') ?></div>
                    <div class="stat-label">Total Revenue</div>
                </div>
            </div>

            <div class="search-bar">
                <input type="text" id="searchInput" placeholder="Search bills...">
                <button id="searchButton">Search</button>
                <button id="newBillButton" onclick="window.location.href='bill-editor.php'" class="primary-button">Create New Bill</button>
            </div>

            <div class="table-container">
                <table class="bills-table">
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
    <div id="deleteModal" class="confirmation-modal">
        <div class="modal-content">
            <div class="modal-title">Confirm Deletion</div>
            <p>Are you sure you want to delete bill <strong id="billNoToDelete"></strong>?</p>
            <p>This action cannot be undone!</p>
            <div class="modal-actions">
                <button class="cancel-button" onclick="hideModal()">Cancel</button>
                <button id="confirmDeleteButton" class="confirm-button">Delete Bill</button>
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
