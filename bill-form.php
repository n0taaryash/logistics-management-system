<?php
// Bill form page
session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Bill - Abhi Road Carrier</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/bill-form.css">
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
                <li class="active"><a href="bill-form.php"><span class="icon">📄</span> Create Bill</a></li>
                <li><a href="settings.php"><span class="icon">⚙️</span> Settings</a></li>
            </ul>
        </div>

        <div class="main-content">
            <div class="header">
                <div class="page-title">Create New Bill</div>
            </div>

            <div class="form-container">
                <form id="billForm">
                    <input type="hidden" id="billId" name="billId">
                    
                    <div class="form-section">
                        <h2>Bill Information</h2>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="toMs">TO M/S:</label>
                                <input type="text" id="toMs" name="toMs" required>
                            </div>
                            <div class="form-group">
                                <label for="billNo">BILL NO:</label>
                                <input type="text" id="billNo" name="billNo" required>
                            </div>
                            <div class="form-group">
                                <label for="date">DATE:</label>
                                <input type="date" id="date" name="date" required>
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
                                <tr>
                                    <td>1</td>
                                    <td><input type="text" name="lrNo" required></td>
                                    <td><input type="date" name="itemDate" required></td>
                                    <td><input type="text" name="vehicleNo" required></td>
                                    <td><input type="text" name="destination" required></td>
                                    <td><input type="text" name="invoiceNo" required></td>
                                    <td><input type="number" name="weight" step="0.01" required class="calc"></td>
                                    <td><input type="number" name="rate" required class="calc"></td>
                                    <td><input type="number" name="extra" value="0" class="calc"></td>
                                    <td><input type="number" name="total" readonly class="readonly"></td>
                                    <td><button type="button" class="remove-row">Remove</button></td>
                                </tr>
                            </tbody>
                        </table>
                        <button type="button" id="addRow" class="add-row-button">Add Row</button>
                    </div>

                    <div class="form-section">
                        <h2>Bill Total</h2>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="grandTotal">Grand Total:</label>
                                <input type="number" id="grandTotal" name="grandTotal" readonly>
                            </div>
                            <div class="form-group">
                                <label for="amountInWords">Amount In Words:</label>
                                <input type="text" id="amountInWords" name="amountInWords" readonly>
                            </div>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" id="cancelButton" class="cancel-button">Cancel</button>
                        <button type="submit" class="save-button">Save Bill</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="js/bill-form.js"></script>
</body>
</html>
