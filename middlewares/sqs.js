// sqsService.js
require('dotenv').config();
const { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const sqs_url = process.env.AWS_SQS_URL;

const sqsClient = new SQSClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

async function publishToQueue(queue, data) {
    const params = {
        MessageBody: JSON.stringify(data),
        QueueUrl: sqs_url + queue,
    };

    try {
        const command = new SendMessageCommand(params);
        const result = await sqsClient.send(command);
        console.log("Published to SQS queue", result);
    } catch (error) {
        console.error("Error publishing to SQS queue:", error);
    }
}

async function receiveMessages(queue, maxNumberOfMessages, waitTimeSeconds) {
    const params = {
        QueueUrl: sqs_url + queue,
        MaxNumberOfMessages: maxNumberOfMessages,
        WaitTimeSeconds: waitTimeSeconds
    };

    return await sqsClient.send(new ReceiveMessageCommand(params));
}

async function deleteMessage(queue, receiptHandle) {
    const params = {
        QueueUrl: sqs_url + queue,
        ReceiptHandle: receiptHandle
    };

    await sqsClient.send(new DeleteMessageCommand(params));
}

module.exports = { publishToQueue, receiveMessages, deleteMessage };
