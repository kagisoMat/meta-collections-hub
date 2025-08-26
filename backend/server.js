const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const collectionRoutes = require('./routes/collections');
const itemRoutes = require('./routes/items');
const uploadRoutes = require('./routes/upload');
const pinterestRoutes = require('./routes/pinterest');
const facebookRoutes = require('./routes/facebook');
const instagramRoutes = require('./routes/instagram');

// Import middleware
const authMiddleware = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/collections', authMiddleware, collectionRoutes);
app.use('/api/items', authMiddleware, itemRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/pinterest', authMiddleware, pinterestRoutes);
app.use('/api/facebook', authMiddleware, facebookRoutes);
app.use('/api/instagram', authMiddleware, instagramRoutes);

// Serve frontend files from the correct directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Catch-all route for SPA - serve index.html for any non-API route
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
  } else {
    res.status(404).json({ message: 'API endpoint not found' });
  }
});

// Socket.io for real-time collaboration
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-collection', (collectionId) => {
    socket.join(collectionId);
    console.log(`User ${socket.id} joined collection ${collectionId}`);
  });
  
  socket.on('collection-update', (data) => {
    socket.to(data.collectionId).emit('collection-update', data);
  });
  
  socket.on('item-status-update', (data) => {
    socket.to(data.collectionId).emit('item-status-update', data);
  });
  
  socket.on('new-comment', (data) => {
    socket.to(data.collectionId).emit('new-comment', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/metacollections', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend served from: ${path.join(__dirname, '../frontend')}`);
});