require('dotenv').config();
const express = require('express');
const cors = require('cors');

const predictRouter = require('./routes/predict');
const recommendRouter = require('./routes/recommend');
const chatRouter = require('./routes/chat');
const simulateRouter = require('./routes/simulate');
const queueRouter = require('./routes/queue');
const package = require('./../package.json')
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Queue AI Backend running', version: package.version });
});

// Routes
app.use('/predict', predictRouter);
app.use('/recommend', recommendRouter);
app.use('/chat', chatRouter);
app.use('/simulate', simulateRouter);
app.use('/queue', queueRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
