const express = require('express');
const Collection = require('../models/collection');
const Item = require('../models/item');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all collections for user
router.get('/', auth, async (req, res) => {
  try {
    const collections = await Collection.find({ 
      $or: [
        { userId: req.user.id },
        { collaborators: req.user.id }
      ]
    }).populate('items').populate('collaborators', 'name email');
    
    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single collection
router.get('/:id', auth, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate('items')
      .populate('collaborators', 'name email')
      .populate('userId', 'name email');
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    // Check if user has access to this collection
    if (collection.userId._id.toString() !== req.user.id && 
        !collection.collaborators.some(c => c._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create collection
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, platform, isCollaborative } = req.body;
    
    const collection = new Collection({
      title,
      description,
      platform,
      userId: req.user.id,
      isCollaborative: isCollaborative || false
    });
    
    await collection.save();
    res.status(201).json(collection);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update collection
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, isCollaborative } = req.body;
    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    // Check if user owns the collection
    if (collection.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    collection.title = title || collection.title;
    collection.description = description || collection.description;
    collection.isCollaborative = isCollaborative !== undefined ? isCollaborative : collection.isCollaborative;
    collection.updatedAt = new Date();
    
    await collection.save();
    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete collection
router.delete('/:id', auth, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    // Check if user owns the collection
    if (collection.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Remove all items in this collection
    await Item.deleteMany({ collectionId: collection._id });
    
    await Collection.findByIdAndDelete(req.params.id);
    res.json({ message: 'Collection deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add collaborator to collection
router.post('/:id/collaborators', auth, async (req, res) => {
  try {
    const { email } = req.body;
    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    // Check if user owns the collection
    if (collection.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Find user by email and add to collaborators
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!collection.collaborators.includes(userToAdd._id)) {
      collection.collaborators.push(userToAdd._id);
      await collection.save();
    }
    
    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove collaborator from collection
router.delete('/:id/collaborators/:userId', auth, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    // Check if user owns the collection
    if (collection.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    collection.collaborators = collection.collaborators.filter(
      collaboratorId => collaboratorId.toString() !== req.params.userId
    );
    
    await collection.save();
    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;