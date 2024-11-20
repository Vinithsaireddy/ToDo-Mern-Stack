import express from "express";
import mongoose from "mongoose";
import cors from "cors"; // To enable cross-origin requests from React
import connectDB from "./config/db.js";
import User from "./models/user.js";
import Todo from "./models/todo.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json()); // Middleware to parse JSON request bodies
app.use(cors({
  origin: process.env.CLIENT_URLS.split(','),
  credentials: true
})); // Enable CORS for the React frontend

// Connect to MongoDB
connectDB();

// Add this middleware after your existing imports
const authenticateUser = async (req, res, next) => {
  const userId = req.params.userId || req.body.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid authentication" });
  }
};

// Register a new user
app.post("/api/users/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();
    
    // Return the userId after successful registration
    res.status(201).json({ 
      message: "User registered successfully!",
      userId: newUser._id 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add this after the register endpoint
app.post("/api/users/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password." });
    }

    // Clear any existing sessions (if you implement session storage later)
    res.status(200).json({ 
      message: "Login successful",
      userId: user._id,
      email: user.email,
      username: user.username
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new todo
app.post("/api/todos", authenticateUser, async (req, res) => {
  const { userId, task, category, priority, dueDate, notes } = req.body;

  if (!task) {
    return res.status(400).json({ 
      message: "Task is required." 
    });
  }

  try {
    const newTodo = new Todo({
      userId: req.user._id,
      task,
      category: category || 'personal',
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || '',
      completed: false
    });

    await newTodo.save();
    res.status(201).json(newTodo);
  } catch (err) {
    console.error('Error creating todo:', err);
    res.status(500).json({ 
      message: "Error creating todo",
      error: err.message 
    });
  }
});


// Get todos for a user
app.get("/api/todos/:userId", authenticateUser, async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user._id });
    res.status(200).json(todos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add this endpoint for toggling todos
app.patch("/api/todos/:id/toggle", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    const todo = await Todo.findOne({ _id: id, userId });
    if (!todo) {
      return res.status(404).json({ message: "Todo not found." });
    }

    todo.completed = !todo.completed;
    await todo.save();

    res.status(200).json({ 
      message: "Todo status updated",
      completed: todo.completed
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add this endpoint for deleting todos
app.delete("/api/todos/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    const todo = await Todo.findOneAndDelete({ _id: id, userId });
    if (!todo) {
      return res.status(404).json({ message: "Todo not found." });
    }

    res.status(200).json({ message: "Todo deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Server initialization
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${port} is busy, trying ${port + 1}`);
    app.listen(port + 1);
  } else {
    console.error(err);
  }
});
