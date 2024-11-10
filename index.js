const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8087;
const ENV = process.env.NODE_ENV || 'production';

// Middleware
app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize WhatsApp Client with Local Auth to save session
const client = new Client({
  authStrategy: new LocalAuth(),
});

// Generate QR code for WhatsApp Web authentication
client.on('qr', (qr) => {
  console.log('Please scan the QR code:');
  qrcode.generate(qr, { small: true });
});

// Confirm when the client is ready
client.on('ready', () => {
  console.log('WhatsApp Client is ready!');
});

// Handle authentication failure
client.on('auth_failure', (msg) => {
  console.error('Authentication failed:', msg);
});

// Handle client disconnect
client.on('disconnected', (reason) => {
  console.log('WhatsApp Client was disconnected:', reason);
  client.destroy();
  client.initialize();
});

// Start the WhatsApp client
client.initialize();

// Function to convert Laos number to WhatsApp format
function formatLaosNumber(number) {
  const cleanedNumber = number.replace(/[^0-9]/g, '');
  const formatted = cleanedNumber.startsWith('0')
    ? `856${cleanedNumber.slice(1)}`
    : cleanedNumber;
  return `${formatted}@c.us`;
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: '🦄🌈✨👋 Server is running 🌍✨🌈🦄' });
});

// Send message endpoint
app.post('/api/v1/send-message', async (req, res) => {
  const { contact, message } = req.body;

  // Log the incoming request
  console.log('Received request:', req.body);

  // Validate input
  if (!contact || !message) {
    return res.status(400).json({ error: 'Contact and message are required' });
  }

  try {
    const formattedNumber = formatLaosNumber(contact);
    console.log(`Formatted Number: ${formattedNumber}`);

    // Send the message using the WhatsApp client
    await client.sendMessage(formattedNumber, message);
    console.log(`Message sent to ${formattedNumber}: "${message}"`);
    return res.status(200).json({ success: `Message sent to ${contact}` });
  } catch (error) {
    console.error('Error sending message:', error.message);
    return res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});

// Middleware for handling 404 errors
app.use((req, res, next) => {
  res.status(404).json({ error: '🔍 - Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message,
    stack: ENV === 'production' ? '🥞' : err.stack,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT} [${ENV}]`);
});
