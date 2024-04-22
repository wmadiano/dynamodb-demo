const { docClient } = require('../config/dynamodb');

const tableName = 'ReceiptInvoiceCounter';

// Function to create a new counter with an initial value for last_receipt_number
const createCounter = async (counter) => {
  // Set the initial value of last_receipt_number if not provided
  if (counter.last_receipt_number === undefined) {
    counter.last_receipt_number = 0; // Starting value
  }

  const params = {
    TableName: tableName,
    Item: counter
  };

  try {
    await docClient.put(params).promise();
    console.log('Counter created successfully with initial last_receipt_number:', counter.last_receipt_number);
    return counter;
  } catch (error) {
    console.error('Error creating counter:', error);
    throw error;
  }
};

// Function to get a counter
const getCounter = async (key) => {
  const params = {
    TableName: tableName,
    Key: key
  };

  try {
    const { Item } = await docClient.get(params).promise();
    return Item;
  } catch (error) {
    console.error('Error retrieving counter:', error);
    throw error;
  }
};

module.exports = {
  createCounter,
  getCounter
};



// aws dynamodb create-table \
//     --table-name ReceiptInvoiceCounter \
//     --attribute-definitions \
//         AttributeName=company_code,AttributeType=S \
//         AttributeName=store_code_terminal_code,AttributeType=S \
//     --key-schema \
//         AttributeName=company_code,KeyType=HASH \
//         AttributeName=store_code_terminal_code,KeyType=RANGE \
//     --billing-mode PAY_PER_REQUEST \
//     --sse-specification Enabled=true \
//     --region us-east-1
