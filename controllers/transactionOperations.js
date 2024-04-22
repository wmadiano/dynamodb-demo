const { docClient } = require('../config/dynamodb');

const updateCounterAndCreateInvoice = async (counterKey, invoiceData) => {
  const transactParams = {
    TransactItems: [
      {
        Update: {
          TableName: 'ReceiptInvoiceCounter',
          Key: counterKey,
          UpdateExpression: 'set last_receipt_number = last_receipt_number + :val',
          ExpressionAttributeValues: {
            ':val': 1
          }
        }
      },
      {
        Put: {
          TableName: 'ReceiptInvoice',
          Item: invoiceData
        }
      }
    ]
  };

  try {
    await docClient.transactWrite(transactParams);
    return {
      updatedCounter: counterKey,
      createdInvoice: invoiceData
    };
  } catch (error) {
    console.error('Transaction Error:', error);
    throw new Error('Failed to execute transaction');
  }
};

module.exports = {
  updateCounterAndCreateInvoice
};
