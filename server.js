const express = require('express');
const bodyParser = require('body-parser');


const {
  createReceipt,
  getAllReceipts,
  getReceiptById,
  deleteReceiptById,
  updateReceiptById
} = require('./controllers/receipt');

const cors = require('cors');
const app = express();

const PORT = 3000;

app.use(bodyParser.json());
app.use(cors());



// POST endpoint to create a new invoice
app.post('/api/receipt', async (req, res) => {
  try {
    const data = req.body;
    if (!data.id || !data.receipt_type || !data.company_code || !data.store_code || !data.terminal_code) {
      // Simple validation to ensure required fields are present
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const newData = await createReceipt(data);
    res.status(201).json({
      message: 'receipt created successfully',
      data: newData
    });
  } catch (error) {
    console.error('Error in creating receipt:', error);
    res.status(500).json({ message: 'Failed to create invoice', error: error.message });
  }
});

// GET endpoint to retrieve all invoices
app.get('/api/receipt', async (req, res) => {
  try {
    const invoices = await getAllReceipts();
    res.status(200).json({
      data: invoices
    });
  } catch (error) {
    console.error('Error in retrieving receipts:', error);
    res.status(500).json({ message: 'Failed to retrieve receipts', error: error.message });
  }
});

// GET endpoint to retrieve an invoice by ID
app.get('/api/receipt/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const invoice = await getReceiptById(invoiceId);
    if (invoice) {
      res.status(200).json({
        message: 'Invoice retrieved successfully',
        data: invoice
      });
    } else {
      res.status(404).json({ message: 'Invoice not found' });
    }
  } catch (error) {
    console.error('Error in getting invoice:', error);
    res.status(500).json({ message: 'Failed to get invoice', error: error.message });
  }
});



// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


module.exports = app;
