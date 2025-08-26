const mongoose = require('mongoose');

const CollectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  platform: { 
    type: String, 
    enum: ['instagram', 'facebook', 'whatsapp', 'pinterest'], 
    required: true 
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isCollaborative: { type: Boolean, default: false },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Collection', CollectionSchema);