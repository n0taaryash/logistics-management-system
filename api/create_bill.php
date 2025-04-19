<?php
header('Content-Type: application/json');

// Get the request body
$requestBody = file_get_contents('php://input');
$billData = json_decode($requestBody, true);

// Validate the data
if ($billData === null) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
    exit;
}

// Ensure required fields are present
$requiredFields = ['toMs', 'billNo', 'date', 'items', 'grandTotal'];
foreach ($requiredFields as $field) {
    if (empty($billData[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
        exit;
    }
}

// Create data directory if it doesn't exist
$dataDir = __DIR__ . '/../data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Path to the bills JSON file
$billsFile = "$dataDir/bills.json";

// Load existing bills or create empty array
$bills = [];
if (file_exists($billsFile)) {
    $billsJson = file_get_contents($billsFile);
    if ($billsJson !== false) {
        $bills = json_decode($billsJson, true) ?? [];
    }
}

// Generate ID for the bill if not provided
if (empty($billData['id'])) {
    $billData['id'] = uniqid();
}

// Add creation timestamp
$billData['createdAt'] = date('c');

// Add the new bill
$bills[] = $billData;

// Save to file
if (file_put_contents($billsFile, json_encode($bills, JSON_PRETTY_PRINT)) === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to save bill data']);
    exit;
}

// Return success response
echo json_encode([
    'success' => true,
    'message' => 'Bill created successfully',
    'id' => $billData['id']
]);
?>
