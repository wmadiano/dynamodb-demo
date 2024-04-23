const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, TransactWriteCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { zeroPadNumber } = require("../utils/numberUtils");
const { receiveMessages, deleteMessage } = require("../middlewares/sqs");


// const client = new DynamoDBClient();
const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const tableNameCounter = "receipt_counter";
const tableNameInvoice = "receipt";


async function assignSeriesNumber(msg) {
    const data = JSON.parse(msg.Body);
    const request = data.item;

    const genId = request.receipt_type+request.company_code+request.store_code+request.terminal_code;

    const counterKey = {
      id: genId
      //,
      //line: request.line
    };
  
    try {
        const counterResult = await docClient.send(new GetCommand({
            TableName: tableNameCounter,
            Key: counterKey
        }));

        let lastReceiptNumber = 0;
        let expectedVersion = 0;
        let isNewCounter = false;




  
        if (counterResult.Item) {
            lastReceiptNumber = counterResult.Item.last_receipt_number;
            expectedVersion = counterResult.Item.version;
        } else {
            isNewCounter = true; // Flag to indicate that we need to create a new counter
        }
  
        lastReceiptNumber += 1; // Increment the counter for the new receipt
  
        const paddedCounter = zeroPadNumber(lastReceiptNumber, 15);
        const formattedReceipt = `${request.receipt_type}-${request.company_code}-${request.store_code}-${request.terminal_code}-${paddedCounter}`;
  
        let transactItems = {
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
                        ConditionExpression: "attribute_not_exists(receipt_number) OR receipt_number <> :rn",
                        ReturnValues: "UPDATED_NEW"
                    }
                }
            ]
        };
  
        if (isNewCounter) {
            transactItems.TransactItems.push({
                Put: {
                    TableName: tableNameCounter,
                    Item: {
                        // id: request.line,
                        id: genId,
                        //line: request.line,
                        receipt_type: request.receipt_type,
                        company_code: request.company_code,
                        store_code: request.store_code,
                        terminal_code: request.terminal_code,
                        last_receipt_number: lastReceiptNumber,
                        version: 1
                    }
                }
            });
        } else {
            transactItems.TransactItems.push({
                Update: {
                    TableName: tableNameCounter,
                    Key: counterKey,
                    UpdateExpression: "SET last_receipt_number = :num, version = version + :one",
                    ExpressionAttributeValues: {
                        ":num": lastReceiptNumber,
                        ":one": 1,
                        ":expectedVersion": expectedVersion
                    },
                    ConditionExpression: "version = :expectedVersion",
                    ReturnValues: "UPDATED_NEW"
                }
            });
        }
  
        // Execute the transaction
        const result = await docClient.send(new TransactWriteCommand(transactItems));
        console.log('Record ID ',request.id, ' has been asigned a receipt # ',formattedReceipt);
        // console.log('Transaction successful:', result);
        // console.log('Receipt number assigned:', formattedReceipt);
  
    } catch (error) {
        // console.error('Error processing transaction:', error);
        throw error; // Rethrow the error for external handling
    }
  }

// async function startConsumer(queue) {
//     while (true) {
//         const messages = await receiveMessages(queue, 10, 20);
//         if (messages.Messages) {
//             for (let message of messages.Messages) {
//                 const data = JSON.parse(message.Body);
//                 const request = data.item;
//                 try{
//                     await assignSeriesNumber(message);
//                     await deleteMessage(queue, message.ReceiptHandle);
//                 }catch(error){
//                     console.error('Failed processing record ID: ',request.id,' retrying.. ',);
//                 }

//             }
//         }
//     }
// }

// Async
async function startConsumer(queue) {
    while (true) {
        // Fetch a batch of messages
        const messages = await receiveMessages(queue, 10, 20);
        if (messages.Messages && messages.Messages.length) {
            await Promise.all(messages.Messages.map(async (message) => {
                const data = JSON.parse(message.Body);
                const request = data.item;
                try {
                    await assignSeriesNumber(message);
                    await deleteMessage(queue, message.ReceiptHandle);
                } catch (error) {
                    console.error('Failed processing record ID: ', request.id, ' retrying.. ');
                    // Implement retry logic or move to dead letter queue
                }
            }));
        }
    }
}


// startConsumer('receipt-series-queue.fifo');
startConsumer('receipt-series-queue');
