const { CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { ddbClient } = require("../config/dynamodb");

async function createReceiptTable() {
    const tableName = 'receipt2';
    const params = {
        TableName: tableName,
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'line', AttributeType: 'S' },
            { AttributeName: 'receipt_number', AttributeType: 'S' }
        ],
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'LineIndex',
                KeySchema: [
                    { AttributeName: 'line', KeyType: 'HASH' }
                ],
                Projection: {
                    ProjectionType: 'ALL'
                }
            },
            {
                IndexName: 'ReceiptNumberIndex',
                KeySchema: [
                    { AttributeName: 'receipt_number', KeyType: 'HASH' }
                ],
                Projection: {
                    ProjectionType: 'ALL'
                }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    };

    try {
        // Check if the table already exists
        await ddbClient.send(new DescribeTableCommand({ TableName: tableName }));
        console.log(`Table ${tableName} already exists.`);
    } catch (error) {
        if (error.name === 'ResourceNotFoundException') {
            // Table does not exist, so create it
            try {
                const data = await ddbClient.send(new CreateTableCommand(params));
                console.log(`Table Created: ${data.TableDescription.TableName}`);
            } catch (createError) {
                console.error("Error creating table", createError);
            }
        } else {
            console.error("Error checking table", error);
        }
    }
}

createReceiptTable();
