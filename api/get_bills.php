<?php
header('Content-Type: application/json');

// Path to the bills JSON file
$billsFile = __DIR__ . '/../data/bills.json';

// If file doesn't exist yet, return empty array
if (!file_exists($billsFile)) {
    echo json_encode([]);
    exit;
}

// Read and return the bills
$bills = file_get_contents($billsFile);

if ($bills === false) {
    // Handle error
    http_response_code(500);
    echo json_encode(['error' => 'Failed to read bills data']);
    exit;
}

echo $bills;
?>
