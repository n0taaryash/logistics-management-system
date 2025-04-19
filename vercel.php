<?php
/**
 * This file helps with Vercel PHP deployment
 * It checks if we're on Vercel and adjusts file storage accordingly
 */

// Function to check if we're running on Vercel
function isVercel() {
    return getenv('VERCEL') == '1';
}

// Function to get data directory path based on environment
function getDataPath() {
    if (isVercel()) {
        // On Vercel, use /tmp for file storage
        return '/tmp/data';
    } else {
        // In local environment, use regular data directory
        return __DIR__ . '/data';
    }
}

// Function to get bills file path
function getBillsFilePath() {
    return getDataPath() . '/bills.json';
}

// Function to initialize data directory
function initializeDataDirectory() {
    $path = getDataPath();
    if (!is_dir($path)) {
        mkdir($path, 0755, true);
    }
    
    $billsFile = getBillsFilePath();
    if (!file_exists($billsFile)) {
        file_put_contents($billsFile, '[]');
    }
}

// Function to get all bills
function getAllBills() {
    $billsFile = getBillsFilePath();
    
    if (!file_exists($billsFile)) {
        return [];
    }
    
    $content = file_get_contents($billsFile);
    if ($content === false) {
        return [];
    }
    
    $bills = json_decode($content, true);
    if (!is_array($bills)) {
        return [];
    }
    
    return $bills;
}

// Function to save bills
function saveBills($bills) {
    $billsFile = getBillsFilePath();
    return file_put_contents($billsFile, json_encode($bills, JSON_PRETTY_PRINT));
}

// Initialize data directory
initializeDataDirectory();
