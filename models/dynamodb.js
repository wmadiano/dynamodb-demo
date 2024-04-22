const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const REGION = process.env.AWS_REGION; // e.g., 'us-west-2'

const ddbClient = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Ensure these are securely managed, preferably through environment variables
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY // Ensure these are securely managed, preferably through environment variables
  }
});

// Create the DynamoDB Document Client
const docClient = DynamoDBDocumentClient.from(ddbClient);

module.exports = { docClient };
