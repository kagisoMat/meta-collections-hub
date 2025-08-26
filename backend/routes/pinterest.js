// routes/pinterest.js
const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const Collection = require('../models/collection');
const Item = require('../models/item');
const router = express.Router();

// Get Pinterest boards
router.get('/boards', auth, async (req, res) => {
  try {
    const { accessToken } = req.query;
    
    if (!accessToken) {
      return res.status(400).json({ message: 'Access token required' });
    }
    
    const response = await axios.get('https://api.pinterest.com/v5/boards', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Pinterest pins from a board
router.get('/boards/:boardId/pins', auth, async (req, res) => {
  try {
    const { accessToken } = req.query;
    const { boardId } = req.params;
    
    if (!accessToken) {
      return res.status(400).json({ message: 'Access token required' });
    }
    
    const response = await axios.get(`https://api.pinterest.com/v5/boards/${boardId}/pins`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Import Pinterest pins
router.post('/import-pins', auth, async (req, res) => {
  try {
    const { accessToken, boardId } = req.body;
    
    if (!accessToken || !boardId) {
      return res.status(400).json({ message: 'Access token and board ID required' });
    }
    
    // Get pins from board
    const response = await axios.get(`https://api.pinterest.com/v5/boards/${boardId}/pins`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const pins = response.data.data || [];
    
    // Create collection
    const collection = new Collection({
      title: `Pinterest Board - ${boardId}`,
      description: `Imported from Pinterest board`,
      platform: 'pinterest',
      userId: req.user.id,
      isCollaborative: false
    });
    
    await collection.save();
    
    // Create items from pins
    for (const pin of pins) {
      const item = new Item({
        title: pin.title || 'Pinterest Pin',
        description: pin.description || '',
        type: 'pin',
        platform: 'pinterest',
        sourceUrl: pin.url || `https://pinterest.com/pin/${pin.id}`,
        thumbnail: pin.images?.standard?.url || null,
        collectionId: collection._id,
        tags: pin.tags || ['pinterest', 'imported'],
        userId: req.user.id,
        createdAt: new Date(pin.created_at)
      });
      
      await item.save();
      collection.items.push(item._id);
    }
    
    await collection.save();
    
    res.json({
      message: `${pins.length} pins imported from Pinterest`,
      collectionId: collection._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;