document.addEventListener('DOMContentLoaded', function() {
    const billForm = document.getElementById('billForm');
    const addRowButton = document.getElementById('addRow');
    const cancelButton = document.getElementById('cancelButton');
    const itemsTableBody = document.getElementById('itemsTableBody');

    // Check if we're editing an existing bill
    const urlParams = new URLSearchParams(window.location.search);
    const isEditing = urlParams.get('edit') === 'true';
    const billId = urlParams.get('id');

    // Initialize form
    initForm();

    // Add event listeners
    addRowButton.addEventListener('click', addRow);
    cancelButton.addEventListener('click', function() {
        window.location.href = 'index.php';
    });
    itemsTableBody.addEventListener('input', handleItemInput);
    itemsTableBody.addEventListener('click', handleRowAction);
    billForm.addEventListener('submit', handleFormSubmit);

    // Initialize the form
    async function initForm() {
        // Set today's date as default
        const today = new Date();
        const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
        document.getElementById('date').value = dateString;
        document.querySelector('input[name="itemDate"]').value = dateString;

        if (isEditing && billId) {
            // Load bill data for editing
            try {
                const response = await fetch(`api/get_bill.php?id=${billId}`);
                if (!response.ok) throw new Error('Failed to fetch bill');
                
                const bill = await response.json();
                
                // Populate form fields
                document.getElementById('billId').value = bill.id;
                document.getElementById('toMs').value = bill.toMs;
                document.getElementById('billNo').value = bill.billNo;
                document.getElementById('date').value = formatDateForInput(bill.date);
                document.getElementById('grandTotal').value = bill.grandTotal;
                document.getElementById('amountInWords').value = bill.amountInWords;
                
                // Clear default row
                itemsTableBody.innerHTML = '';
                
                // Add rows for each item
                bill.items.forEach((item, index) => {
                    addRow(item);
                });
                
                // Update page title
                document.querySelector('.page-title').textContent = 'Edit Bill';
            } catch (error) {
                console.error('Error loading bill:', error);
                alert('Failed to load bill data. Returning to dashboard.');
                window.location.href = 'index.php';
            }
        } else {
            // Generate a new bill number
            try {
                const response = await fetch('api/generate_bill_number.php');
                if (!response.ok) throw new Error('Failed to generate bill number');
                
                const data = await response.json();
                document.getElementById('billNo').value = data.billNumber;
            } catch (error) {
                console.error('Error generating bill number:', error);
                // Set a default bill number based on date
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                document.getElementById('billNo').value = `ARC/${year}/${month}/001`;
            }
        }
    }

    // Add a new row to the items table
    function addRow(itemData = null) {
        const rowCount = itemsTableBody.rows.length;
        const row = itemsTableBody.insertRow();
        
        // Use data from existing item or defaults
        const item = itemData || {
            srNo: rowCount + 1,
            lrNo: '',
            date: document.querySelector('input[name="itemDate"]').value || '',
            vehicleNo: '',
            destination: '',
            invoiceNo: '',
            weight: '',
            rate: '',
            extra: '0',
            total: ''
        };
        
        row.innerHTML = `
            <td>${item.srNo}</td>
            <td><input type="text" name="lrNo" value="${item.lrNo}" required></td>
            <td><input type="date" name="itemDate" value="${formatDateForInput(item.date)}" required></td>
            <td><input type="text" name="vehicleNo" value="${item.vehicleNo}" required></td>
            <td><input type="text" name="destination" value="${item.destination}" required></td>
            <td><input type="text" name="invoiceNo" value="${item.invoiceNo}" required></td>
            <td><input type="number" name="weight" step="0.01" value="${item.weight}" required class="calc"></td>
            <td><input type="number" name="rate" value="${item.rate}" required class="calc"></td>
            <td><input type="number" name="extra" value="${item.extra}" class="calc"></td>
            <td><input type="number" name="total" value="${item.total}" readonly class="readonly"></td>
            <td><button type="button" class="remove-row">Remove</button></td>
        `;
        
        // Calculate total if we have the necessary values
        if (item.weight && item.rate) {
            calculateRowTotal(row);
        }
    }

    // Handle input changes for calculation
    function handleItemInput(event) {
        if (event.target.classList.contains('calc')) {
            const row = event.target.closest('tr');
            calculateRowTotal(row);
        }
    }

    // Handle row actions (remove button)
    function handleRowAction(event) {
        if (event.target.classList.contains('remove-row')) {
            if (itemsTableBody.rows.length > 1) {
                const row = event.target.closest('tr');
                row.remove();
                
                // Update row numbers
                const rows = itemsTableBody.rows;
                for (let i = 0; i < rows.length; i++) {
                    rows[i].cells[0].textContent = i + 1;
                }
                
                // Recalculate grand total
                calculateGrandTotal();
            } else {
                alert('Cannot remove the last row. At least one item is required.');
            }
        }
    }

    // Calculate total for a row
    function calculateRowTotal(row) {
        const weightInput = row.querySelector('input[name="weight"]');
        const rateInput = row.querySelector('input[name="rate"]');
        const extraInput = row.querySelector('input[name="extra"]');
        const totalInput = row.querySelector('input[name="total"]');
        
        const weight = parseFloat(weightInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        const extra = parseFloat(extraInput.value) || 0;
        
        const total = (weight * rate) + extra;
        totalInput.value = total.toFixed(2);
        
        // Update grand total
        calculateGrandTotal();
    }

    // Calculate grand total for all rows
    function calculateGrandTotal() {
        let grandTotal = 0;
        
        const rows = itemsTableBody.rows;
        for (let i = 0; i < rows.length; i++) {
            const totalInput = rows[i].querySelector('input[name="total"]');
            grandTotal += parseFloat(totalInput.value) || 0;
        }
        
        document.getElementById('grandTotal').value = grandTotal.toFixed(2);
        document.getElementById('amountInWords').value = numberToWords(grandTotal);
    }

    // Handle form submission
    async function handleFormSubmit(event) {
        event.preventDefault();
        
        try {
            // Collect form data
            const formData = new FormData(billForm);
            const billData = {
                id: formData.get('billId') || undefined,
                toMs: formData.get('toMs'),
                billNo: formData.get('billNo'),
                date: formatDate(formData.get('date')),
                grandTotal: formData.get('grandTotal'),
                amountInWords: formData.get('amountInWords'),
                items: []
            };
            
            // Collect items data
            const rows = itemsTableBody.rows;
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                billData.items.push({
                    srNo: i + 1,
                    lrNo: row.querySelector('input[name="lrNo"]').value,
                    date: formatDate(row.querySelector('input[name="itemDate"]').value),
                    vehicleNo: row.querySelector('input[name="vehicleNo"]').value,
                    destination: row.querySelector('input[name="destination"]').value,
                    invoiceNo: row.querySelector('input[name="invoiceNo"]').value,
                    weight: row.querySelector('input[name="weight"]').value,
                    rate: row.querySelector('input[name="rate"]').value,
                    extra: row.querySelector('input[name="extra"]').value,
                    total: row.querySelector('input[name="total"]').value
                });
            }
            
            // Send to server
            const url = isEditing ? 'api/update_bill.php' : 'api/create_bill.php';
            const method = isEditing ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(billData)
            });
            
            if (!response.ok) throw new Error('Failed to save bill');
            
            const result = await response.json();
            
            if (result.success) {
                alert(`Bill ${isEditing ? 'updated' : 'created'} successfully!`);
                
                // Open bill in new tab and return to dashboard
                window.open(`bill.php?id=${result.id}`, '_blank');
                window.location.href = 'index.php';
            } else {
                throw new Error(result.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Error saving bill:', error);
            alert(`Failed to save bill: ${error.message}`);
        }
    }

    // Helper: Format date from YYYY-MM-DD to DD.MM.YYYY
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}.${month}.${year}`;
    }

    // Helper: Format date for input field (YYYY-MM-DD)
    function formatDateForInput(dateStr) {
        if (!dateStr) return '';
        
        if (dateStr.includes('-')) {
            // Already in YYYY-MM-DD format
            return dateStr;
        }
        
        // Convert from DD.MM.YYYY to YYYY-MM-DD
        const [day, month, year] = dateStr.split('.');
        return `${year}-${month}-${day}`;
    }

    // Helper: Convert number to words
    function numberToWords(amount) {
        const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
        const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
        const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
        
        // Simple implementation for amounts up to lakhs
        function convert(num) {
            if (num < 10) return ones[num];
            if (num < 20) return teens[num - 10];
            if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
            if (num < 1000) return ones[Math.floor(num / 100)] + ' HUNDRED' + (num % 100 ? ' ' + convert(num % 100) : '');
            if (num < 100000) return convert(Math.floor(num / 1000)) + ' THOUSAND' + (num % 1000 ? ' ' + convert(num % 1000) : '');
            return convert(Math.floor(num / 100000)) + ' LAKH' + (num % 100000 ? ' ' + convert(num % 100000) : '');
        }
        
        const wholePart = Math.floor(amount);
        const decimalPart = Math.round((amount - wholePart) * 100);
        
        let result = convert(wholePart);
        
        if (decimalPart > 0) {
            result += ' POINT ' + convert(decimalPart);
        }
        
        return result + ' ONLY';
    }
});
