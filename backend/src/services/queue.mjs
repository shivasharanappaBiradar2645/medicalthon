import amqp from "amqplib";
import { QUEUE_URL } from "../config.mjs";

let connection;
let channel;

const QUEUE_NAME = 'json_durable_queue';

console.log(QUEUE_URL)
async function connectRabbitMQ() {
  if (connection && channel) return { connection, channel };

  connection = await amqp.connect(QUEUE_URL);
  channel = await connection.createChannel();

  // Durable queue declaration
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log("✅ Connected to RabbitMQ");

  connection.on('error', (err) => {
    console.error("RabbitMQ connection error:", err);
    connection = null;
    channel = null;
  });

  connection.on('close', () => {
    console.warn("RabbitMQ connection closed");
    connection = null;
    channel = null;
  });

  return { connection, channel };
}

async function sendMessageToQueue(messageObj) {
  const { channel } = await connectRabbitMQ();
  const buffer = Buffer.from(JSON.stringify(messageObj));

  channel.sendToQueue(QUEUE_NAME, buffer, {
    persistent: true
  });

  console.log("📤 Sent message:", messageObj);
}
const queue = await connectRabbitMQ();
module.exports = {
  connectRabbitMQ,
  sendMessageToQueue
};
