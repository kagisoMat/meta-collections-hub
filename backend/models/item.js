const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: { 
    type: String, 
    enum: ['image', 'video', 'post', 'link', 'pin', 'reel'], 
    required: true 
  },
  platform: { 
    type: String, 
    enum: ['instagram', 'facebook', 'whatsapp', 'pinterest'], 
    required: true 
  },
  sourceUrl: { type: String, required: true },
  thumbnail: { type: String },
  status: { 
    type: String, 
    enum: ['saved', 'in-progress', 'done'], 
    default: 'saved' 
  },
  tags: [{ type: String }],
  collectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', ItemSchema);