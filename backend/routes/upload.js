const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const { parseWhatsAppExport } = require('../utils/whatsappParser');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|txt/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and text files are allowed'));
    }
  }
});

// Upload WhatsApp export
router.post('/whatsapp', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    if (path.extname(req.file.originalname).toLowerCase() !== '.txt') {
      return res.status(400).json({ message: 'Only text files are allowed for WhatsApp export' });
    }
    
    const fs = require('fs').promises;
    const fileContent = await fs.readFile(req.file.path, 'utf8');
    
    // Parse WhatsApp export
    const items = parseWhatsAppExport(fileContent);
    
    // Create a collection for these items
    const Collection = require('../models/collection');
    const Item = require('../models/item');
    
    const collection = new Collection({
      title: 'WhatsApp Saved Items',
      description: 'Imported from WhatsApp export',
      platform: 'whatsapp',
      userId: req.user.id,
      isCollaborative: false
    });
    
    await collection.save();
    
    // Create items
    for (const itemData of items) {
      const item = new Item({
        title: itemData.content.substring(0, 50) + '...',
        description: `From ${itemData.sender} at ${itemData.timestamp}`,
        type: 'link',
        platform: 'whatsapp',
        sourceUrl: itemData.content,
        thumbnail: null,
        collectionId: collection._id,
        tags: ['whatsapp', 'imported'],
        userId: req.user.id
      });
      
      await item.save();
      collection.items.push(item._id);
    }
    
    await collection.save();
    
    // Clean up uploaded file
    await fs.unlink(req.file.path);
    
    res.json({
      message: `${items.length} items imported from WhatsApp`,
      collectionId: collection._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload image for recreated items
router.post('/image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    
    res.json({
      message: 'Image uploaded successfully',
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;