const express = require('express');
const bodyParser = require('body-parser');
const { createInvoice, getAllInvoices } = require('./models/receiptInvoiceModel'); // Ensure the path matches your project structure
const cors = require('cors');
const app = express();


const PORT = 3000;

app.use(bodyParser.json());

app.use(cors());


// app.use(cors({
//   origin: 'http://localhost:6000' // adjust this depending on where your frontend is hosted
// }));

// POST endpoint to create a new invoice
app.post('/api/receiptinvoice', async (req, res) => {
  try {
    const invoiceData = req.body;
    if (!invoiceData.id || !invoiceData.company_code) {
      // Simple validation to ensure required fields are present
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const newInvoice = await createInvoice(invoiceData);
    res.status(201).json({
      message: 'Invoice created successfully',
      data: newInvoice
    });
  } catch (error) {
    console.error('Error in creating invoice:', error);
    res.status(500).json({ message: 'Failed to create invoice', error: error.message });
  }
});

app.get('/', async (req, res) => {
  try {
    console.log("Fetching invoices...");
    const invoices = await getAllInvoices();
    console.log("Invoices fetched:", invoices);
    res.status(200).json({
      message: 'Invoices retrieved successfully',
      data: invoices
    });
  } catch (error) {
    console.error('Error in retrieving invoices:', error);
    res.status(500).json({ message: 'Failed to retrieve invoices', error: error.message });
  }
});





// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
