const express = require('express');
const Item = require('../models/item');
const Collection = require('../models/collection');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all items for user
router.get('/', auth, async (req, res) => {
  try {
    const { status, platform, collectionId } = req.query;
    let query = { userId: req.user.id };
    
    if (status) query.status = status;
    if (platform) query.platform = platform;
    if (collectionId) query.collectionId = collectionId;
    
    const items = await Item.find(query).populate('collectionId');
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single item
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('collectionId');
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Check if user owns the item or has access through collaboration
    if (item.userId.toString() !== req.user.id) {
      const collection = await Collection.findOne({ 
        _id: item.collectionId, 
        collaborators: req.user.id 
      });
      
      if (!collection) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create item
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, type, platform, sourceUrl, thumbnail, collectionId, tags } = req.body;
    
    const item = new Item({
      title,
      description,
      type,
      platform,
      sourceUrl,
      thumbnail,
      collectionId,
      tags,
      userId: req.user.id
    });
    
    await item.save();
    
    // Add item to collection if collectionId is provided
    if (collectionId) {
      await Collection.findByIdAndUpdate(
        collectionId,
        { $push: { items: item._id } }
      );
    }
    
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update item
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Check if user owns the item or has access through collaboration
    if (item.userId.toString() !== req.user.id) {
      const collection = await Collection.findOne({ 
        _id: item.collectionId, 
        collaborators: req.user.id 
      });
      
      if (!collection) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }
    
    item.title = title || item.title;
    item.description = description || item.description;
    item.tags = tags || item.tags;
    item.updatedAt = new Date();
    
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete item
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Check if user owns the item or has access through collaboration
    if (item.userId.toString() !== req.user.id) {
      const collection = await Collection.findOne({ 
        _id: item.collectionId, 
        collaborators: req.user.id 
      });
      
      if (!collection) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }
    
    // Remove item from collection if it belongs to one
    if (item.collectionId) {
      await Collection.findByIdAndUpdate(
        item.collectionId,
        { $pull: { items: item._id } }
      );
    }
    
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update item status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Check if user owns the item or has access through collaboration
    if (item.userId.toString() !== req.user.id) {
      const collection = await Collection.findOne({ 
        _id: item.collectionId, 
        collaborators: req.user.id 
      });
      
      if (!collection) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }
    
    item.status = status;
    item.updatedAt = new Date();
    await item.save();
    
    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io && item.collectionId) {
      io.to(item.collectionId.toString()).emit('item-status-update', {
        itemId: item._id,
        status: item.status,
        updatedBy: req.user.id
      });
    }
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;