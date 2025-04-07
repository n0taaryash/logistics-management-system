import React, { useState } from 'react';
import jsPDF from 'jspdf';

function BiltyCreator() {
  const [formData, setFormData] = useState({
    lorryNo: '',
    invoiceNo: '',
    consignor: '',
    consignee: '',
    address: '',
    gst: '',
    policyNo: '',
    packageDetails: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = () => {
    const doc = new jsPDF();
    // Add content to PDF
    doc.text('Bilty Details', 10, 10);
    doc.text(`Lorry No: ${formData.lorryNo}`, 10, 20);
    // Add more fields as required
    doc.save('bilty.pdf');
  };

  return (
    <div className="bilty-creator-container">
      <h2>Create Bilty</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="lorryNo"
          placeholder="Lorry No"
          value={formData.lorryNo}
          onChange={handleChange}
        />
        <input
          type="text"
          name="invoiceNo"
          placeholder="Invoice No"
          value={formData.invoiceNo}
          onChange={handleChange}
        />
        {/* Add more input fields as required */}
        <button type="submit">Generate PDF</button>
      </form>
    </div>
  );
}

export default BiltyCreator;
