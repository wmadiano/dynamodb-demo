const express = require('express');
const bodyParser = require('body-parser');
const {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  deleteInvoiceById,
  updateInvoiceById
} = require('./models/bak/receiptInvoiceModel');

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

// GET endpoint to retrieve all invoices
app.get('/api/receiptinvoice', async (req, res) => {
  try {
    const invoices = await getAllInvoices();
    res.status(200).json({
      message: 'Invoices retrieved successfully',
      data: invoices
    });
  } catch (error) {
    console.error('Error in retrieving invoices:', error);
    res.status(500).json({ message: 'Failed to retrieve invoices', error: error.message });
  }
});

// GET endpoint to retrieve an invoice by ID
app.get('/api/receiptinvoice/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const invoice = await getInvoiceById(invoiceId);
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

// DELETE endpoint to delete an invoice by ID
app.delete('/api/receiptinvoice/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    await deleteInvoiceById(invoiceId);
    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error in deleting invoice:', error);
    res.status(500).json({ message: 'Failed to delete invoice', error: error.message });
  }
});

// PUT endpoint to update an invoice by ID
app.put('/api/receiptinvoice/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const updateData = req.body;
    const updatedInvoice = await updateInvoiceById(invoiceId, updateData);
    res.status(200).json({
      message: 'Invoice updated successfully',
      data: updatedInvoice
    });
  } catch (error) {
    console.error('Error in updating invoice:', error);
    res.status(500).json({ message: 'Failed to update invoice', error: error.message });
  }
});


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
