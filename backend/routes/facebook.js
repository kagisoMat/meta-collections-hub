const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const Collection = require('../models/collection');
const Item = require('../models/item');
const router = express.Router();

// Get Facebook saved items
router.get('/saved', auth, async (req, res) => {
  try {
    const { accessToken } = req.query;
    
    if (!accessToken) {
      return res.status(400).json({ message: 'Access token required' });
    }
    
    // Get user ID first
    const userResponse = await axios.get('https://graph.facebook.com/v19.0/me', {
      params: {
        access_token: accessToken,
        fields: 'id,name'
      }
    });
    
    const userId = userResponse.data.id;
    
    // Get saved items
    const savedResponse = await axios.get(`https://graph.facebook.com/v19.0/${userId}/saved`, {
      params: {
        access_token: accessToken,
        fields: 'created_time,data'
      }
    });
    
    res.json(savedResponse.data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Import Facebook saved items
router.post('/import-saved', auth, async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ message: 'Access token required' });
    }
    
    // Get user ID first
    const userResponse = await axios.get('https://graph.facebook.com/v19.0/me', {
      params: {
        access_token: accessToken,
        fields: 'id,name'
      }
    });
    
    const userId = userResponse.data.id;
    
    // Get saved items
    const savedResponse = await axios.get(`https://graph.facebook.com/v19.0/${userId}/saved`, {
      params: {
        access_token: accessToken,
        fields: 'created_time,data'
      }
    });
    
    const savedItems = savedResponse.data.data || [];
    
    // Create collection
    const collection = new Collection({
      title: 'Facebook Saved Items',
      description: `Imported from Facebook`,
      platform: 'facebook',
      userId: req.user.id,
      isCollaborative: false
    });
    
    await collection.save();
    
    // Create items from saved items
    for (const savedItem of savedItems) {
      const itemData = savedItem.data;
      if (!itemData) continue;
      
      let type = 'post';
      let sourceUrl = `https://www.facebook.com/${itemData.id}`;
      let thumbnail = null;
      
      if (itemData.picture) {
        type = 'image';
        thumbnail = itemData.picture;
      } else if (itemData.source) {
        type = 'video';
        thumbnail = itemData.picture;
      }
      
      const item = new Item({
        title: itemData.name || itemData.message?.substring(0, 50) || 'Facebook Post',
        description: itemData.message || itemData.description || '',
        type: type,
        platform: 'facebook',
        sourceUrl: sourceUrl,
        thumbnail: thumbnail,
        collectionId: collection._id,
        tags: ['facebook', 'imported'],
        userId: req.user.id,
        createdAt: new Date(savedItem.created_time)
      });
      
      await item.save();
      collection.items.push(item._id);
    }
    
    await collection.save();
    
    res.json({
      message: `${savedItems.length} items imported from Facebook`,
      collectionId: collection._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;