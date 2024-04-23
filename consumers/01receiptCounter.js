const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, TransactWriteCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { zeroPadNumber } = require("../utils/numberUtils");
const { receiveMessages,publishToQueue,deleteMessage } = require("../middlewares/sqs");


// const client = new DynamoDBClient();
const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const tableNameCounter = "receipt_counter";


async function setupCounter(msg){
    const data = JSON.parse(msg.Body);
    const request = data.item;
    const genId = request.receipt_type + request.company_code + request.store_code + request.terminal_code;
    const counterKey = { id: genId };

    try {
        const counterResult = await docClient.send(new GetCommand({
            TableName: tableNameCounter,
            Key: counterKey
        }));

        if (counterResult.Item) {
            console.log('Counter ', genId, ' existing pushing record id ',request.id,' to queue for receipting.');
            await publishToQueue('receipt-series-queue', { item: request });
            return;
        }

        const transactItems = {
            TransactItems: [{
                Put: {
                    TableName: tableNameCounter,
                    Item: {
                        id: genId,
                        receipt_type: request.receipt_type,
                        company_code: request.company_code,
                        store_code: request.store_code,
                        terminal_code: request.terminal_code,
                        last_receipt_number: 0, // Initial setup with zero
                        version: 1
                    }
                }
            }]
        };

        await docClient.send(new TransactWriteCommand(transactItems));
        console.log('Counter ', genId, ' has been created pushing record id ',request.id,' for receipting.');
        await publishToQueue('receipt-series-queue', { item: request });

    } catch (error) {
        // console.error('Error in setupCounter:', error);
        console.log('Error creating counter ', genId, 'for request id ',request.id);
        throw error; // Rethrow to handle externally
    }
}

async function startSetupCounter(queue) {
    while (true) {
        const messages = await receiveMessages(queue, 10, 20);
        if (messages.Messages && messages.Messages.length) {
            await Promise.all(messages.Messages.map(async (message) => {
                try {
                    await setupCounter(message);
                    await deleteMessage(queue, message.ReceiptHandle);
                } catch (error) {
                    console.log('Failed generating counter retrying.. ');
                }
            }));
        }
    }
}


function startAll() {
    startSetupCounter('receipt-counter-queue');
}

startAll();
