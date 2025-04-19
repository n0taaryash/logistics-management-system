<?php
// Check if we need JSON response or redirect
$needsRedirect = isset($_GET['redirect']) && $_GET['redirect'] == '1';

if (!$needsRedirect) {
    header('Content-Type: application/json');
}

// Get bill ID
$billId = $_GET['id'] ?? '';

if (empty($billId)) {
    if ($needsRedirect) {
        header('Location: ../index.php?error=Bill+ID+is+required');
        exit;
    } else {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Bill ID is required'
        ]);
        exit;
    }
}

// Path to bills file
$billsFile = __DIR__ . '/../data/bills.json';

if (!file_exists($billsFile)) {
    if ($needsRedirect) {
        header('Location: ../index.php?error=Bills+data+not+found');
        exit;
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Bills data not found'
        ]);
        exit;
    }
}

try {
    // Read bills data
    $bills = json_decode(file_get_contents($billsFile), true);
    
    if (!is_array($bills)) {
        throw new Exception('Invalid bills data format');
    }
    
    // Find and remove the bill
    $billFound = false;
    $updatedBills = [];
    
    foreach ($bills as $bill) {
        if ($bill['id'] === $billId) {
            $billFound = true;
        } else {
            $updatedBills[] = $bill;
        }
    }
    
    if (!$billFound) {
        if ($needsRedirect) {
            header('Location: ../index.php?error=Bill+not+found');
            exit;
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Bill not found'
            ]);
            exit;
        }
    }
    
    // Save updated bills
    file_put_contents($billsFile, json_encode($updatedBills, JSON_PRETTY_PRINT));
    
    // Return success
    if ($needsRedirect) {
        header('Location: ../index.php?success=delete');
        exit;
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'Bill deleted successfully'
        ]);
    }
} catch (Exception $e) {
    if ($needsRedirect) {
        header('Location: ../index.php?error=' . urlencode('Error: ' . $e->getMessage()));
        exit;
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
}
?>
