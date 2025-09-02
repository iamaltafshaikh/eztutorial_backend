const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Connect Auth Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Connect Course Routes
app.use('/api/courses', require('./routes/courseRoutes'));

// Connect User Routes
app.use('/api/users', require('./routes/userRoutes'));

const PORT = process.env.PORT || 5000;
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running 🚀" });
});
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));