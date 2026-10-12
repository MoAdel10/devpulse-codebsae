const express = require('express');
const path = require('path');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Required to read form data

// Create a connection pool to RDS MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Home route: Test DB connection and fetch tasks
app.get('/', async (req, res) => {
  try {
    // Check connection & fetch tasks concurrently
    await pool.query('SELECT 1');
    const [rows] = await pool.query('SELECT * FROM tasks ORDER BY id DESC');

    res.render('index', {
      dbStatus: 'success',
      message: 'Successfully queried RDS MySQL database!',
      timestamp: new Date().toLocaleString(),
      tasks: rows
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.render('index', {
      dbStatus: 'error',
      message: error.message,
      tasks: []
    });
  }
});

// POST route: Add a new task to RDS MySQL
app.post('/tasks', async (req, res) => {
  const { title } = req.body;
  if (title) {
    try {
      await pool.query('INSERT INTO tasks (title, status) VALUES (?, ?)', [title, 'Pending']);
    } catch (error) {
      console.error('Failed to insert task:', error);
    }
  }
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`DevPulse app running on port ${PORT}`);
});