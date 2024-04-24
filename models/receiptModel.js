const { CreateTableCommand } = require('@aws-sdk/client-dynamodb');
// const { docClient } = require("../config/dynamodb");
const { ddbClient } = require("../config/dynamodb");

async function createReceiptTable() {
    const params = {
        TableName: 'receipt2',
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'line', AttributeType: 'N' }, // assuming 'line' is a numeric field
            { AttributeName: 'receipt_number', AttributeType: 'S' }
        ],
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' } // Partition key
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'LineIndex',
                KeySchema: [
                    { AttributeName: 'line', KeyType: 'HASH' }
                ],
                Projection: {
                    ProjectionType: 'ALL' // Project all attributes to the index
                }
            },
            {
                IndexName: 'ReceiptNumberIndex',
                KeySchema: [
                    { AttributeName: 'receipt_number', KeyType: 'HASH' }
                ],
                Projection: {
                    ProjectionType: 'ALL' // Project all attributes to the index
                }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST' // Enables on-demand pricing
    };

    try {
        const data = await ddbClient.send(new CreateTableCommand(params));
        console.log(`Table Created: ${data.TableDescription.TableName}`);
    } catch (err) {
        console.error("Error", err);
    }
}

createReceiptTable();