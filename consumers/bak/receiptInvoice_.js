const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { zeroPadNumber } = require("../../utils/numberUtils");
const { receiveMessages, deleteMessage } = require("../../middlewares/sqs");

// Initialize DynamoDB Clients
const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const tableNameCounter = 'ReceiptInvoiceCounter';
const tableNameInvoice = 'ReceiptInvoice';

async function assignSeriesNumber(msg) {
  const data = JSON.parse(msg.Body);
  const request = data.item;
  const counterKey = {
    company_code: request.company_code, // String
    store_code_terminal_code: request.store_code + "#" + request.terminal_code// String formatted correctly
  };

  try {
      const counter = await docClient.send(new GetCommand({
          TableName: tableNameCounter,
          Key: counterKey
      }));

      let lastReceiptNumber = counter.Item ? counter.Item.last_receipt_number : 0;
      lastReceiptNumber += 1;

      const paddedCounter = zeroPadNumber(lastReceiptNumber, 15);
      const formattedReceipt = `SI-${request.company_code}-${request.store_code}-${request.terminal_code}-${paddedCounter}`;

      const transactItems = {
          TransactItems: [
              {
                  Update: {
                      TableName: tableNameInvoice,
                      Key: { id: request.id },
                      UpdateExpression: "SET receipt_number = :rn, processing_status = :ps",
                      ExpressionAttributeValues: {
                          ":rn": formattedReceipt,
                          ":ps": "pending pdf generation"
                      },
                      ReturnValues: "UPDATED_NEW"
                  }
              },
              {
                  Update: {
                      TableName: tableNameCounter,
                      Key: counterKey,
                      UpdateExpression: "SET last_receipt_number = :num",
                      ExpressionAttributeValues: { ":num": lastReceiptNumber },
                      ReturnValues: "UPDATED_NEW"
                  }
              }
          ]
      };

      const result = await docClient.send(new TransactWriteCommand(transactItems));
      console.log('Transaction successful:', result);
      console.log('Receipt number assigned:', formattedReceipt);

      // Publish to SQS queue for PDF generation into S3
      // TODO: Implementation of publishing logic

  } catch (error) {
      console.error('Error processing transaction:', error);
      throw error; // Rethrow the error for external handling
  }
}


async function startConsumer(queue) {
    while (true) {
        const messages = await receiveMessages(queue, 10, 20);
        if (messages.Messages) {
            for (let message of messages.Messages) {
                await assignSeriesNumber(message);
                await deleteMessage(queue, message.ReceiptHandle);
            }
        }
    }
}

startConsumer('si-receipt-for-invoice-gen');
