const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const {publishToQueue, receiveMessages, deleteMessage} = require("../middlewares/sqs");

// Initialize the DynamoDB Client
const dbClient = new DynamoDBClient({ region: 'us-east-1' });  // Specify the region as needed

// Initialize the DynamoDB Document Client
const docClient = DynamoDBDocumentClient.from(dbClient);

const tableName = 'ReceiptInvoice';

// Function to create a new invoice
const createInvoice = async (invoice) => {
  const params = {
    TableName: tableName,
    Item: invoice
  };

  try {
    await docClient.send(new PutCommand(params));
    console.log(invoice);

    const item = invoice;

    publishToQueue('si-receipt-for-invoice-gen', { item })
    .then(() => {
      console.log("Publish successful");
    })
    .catch((err) => {
      console.error("Error in publishing to queue:", err);
      // Optionally, you might want to log this error or handle it further
    });
    
    return invoice;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

// Function to retrieve all invoices
const getAllInvoices = async () => {
  const params = {
    TableName: tableName
  };

  try {
    const data = await docClient.send(new ScanCommand(params));
    return data.Items;
  } catch (error) {
    console.error('Error retrieving invoices:', error);
    throw error;
  }
};

module.exports = {
  createInvoice,
  getAllInvoices
};
