const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand
} = require('@aws-sdk/lib-dynamodb');
const { publishToQueue, receiveMessages, deleteMessage } = require("../middlewares/sqs");

// Initialize the DynamoDB Client
const dbClient = new DynamoDBClient({ region: 'us-east-1' });

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
    console.log("Invoice created:", invoice);

    // Publish to SQS
    await publishToQueue('si-receipt-for-invoice-gen', { item: invoice })
      .then(() => console.log("Publish successful"))
      .catch(err => console.error("Error in publishing to queue:", err));

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

// Function to get an invoice by ID
const getInvoiceById = async (id) => {
  const params = {
    TableName: tableName,
    Key: { id }
  };

  try {
    const { Item } = await docClient.send(new GetCommand(params));
    return Item;
  } catch (error) {
    console.error('Error getting invoice by ID:', error);
    throw error;
  }
};

// Function to delete an invoice by ID
const deleteInvoiceById = async (id) => {
  const params = {
    TableName: tableName,
    Key: { id }
  };

  try {
    await docClient.send(new DeleteCommand(params));
    console.log(`Invoice with ID ${id} deleted successfully.`);
  } catch (error) {
    console.error('Error deleting invoice by ID:', error);
    throw error;
  }
};

// Function to update an invoice by ID
const updateInvoiceById = async (id, updateData) => {
  const updateExpression = Object.keys(updateData).map(key => `#${key} = :${key}`).join(', ');
  const expressionAttributeNames = Object.keys(updateData).reduce((acc, key) => {
    acc[`#${key}`] = key;
    return acc;
  }, {});
  const expressionAttributeValues = Object.keys(updateData).reduce((acc, key) => {
    acc[`:${key}`] = updateData[key];
    return acc;
  }, {});

  const params = {
    TableName: tableName,
    Key: { id },
    UpdateExpression: `set ${updateExpression}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "UPDATED_NEW"
  };

  try {
    const { Attributes } = await docClient.send(new UpdateCommand(params));
    console.log(`Invoice with ID ${id} updated successfully.`);
    return Attributes;
  } catch (error) {
    console.error('Error updating invoice by ID:', error);
    throw error;
  }
};

module.exports = {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  deleteInvoiceById,
  updateInvoiceById
};
