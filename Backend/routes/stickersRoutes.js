import express from 'express';
import Sticker from '../models/Sticker.js';
import { getStickersFromCloudinary } from '../services/cloudinaryService.js';

const router = express.Router();

// ✅ GET ALL STICKERS
router.get('/', async (req, res) => {
  try {
    // First try MongoDB
    let stickers = await Sticker.find().sort({ createdAt: -1 });

    // If no stickers in MongoDB, get from Cloudinary
    if (stickers.length === 0) {
      const cloudinaryStickers = await getStickersFromCloudinary();
      // Save to MongoDB for future queries
      stickers = await Sticker.insertMany(cloudinaryStickers);
    }

    res.json(stickers);
  } catch (error) {
    console.error('Error fetching stickers:', error);
    res.status(500).json({ message: 'Failed to fetch stickers', error: error.message });
  }
});

// ✅ SEARCH STICKERS
router.get('/search/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    const stickers = await Sticker.find({
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { keywords: { $regex: keyword, $options: 'i' } },
        { category: { $regex: keyword, $options: 'i' } },
      ],
    });

    res.json(stickers);
  } catch (error) {
    console.error('Error searching stickers:', error);
    res.status(500).json({ message: 'Failed to search stickers', error: error.message });
  }
});

// ✅ GET STICKER BY ID
router.get('/:id', async (req, res) => {
  try {
    const sticker = await Sticker.findById(req.params.id);
    if (!sticker) {
      return res.status(404).json({ message: 'Sticker not found' });
    }
    res.json(sticker);
  } catch (error) {
    console.error('Error fetching sticker:', error);
    res.status(500).json({ message: 'Failed to fetch sticker', error: error.message });
  }
});

// ✅ ADD NEW STICKER (Admin only)
router.post('/', async (req, res) => {
  try {
    const { name, keywords, url, cloudinaryId, category } = req.body;

    const sticker = new Sticker({
      name,
      keywords: keywords || [],
      url,
      cloudinaryId,
      category: category || 'general',
    });

    const saved = await sticker.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error adding sticker:', error);
    res.status(500).json({ message: 'Failed to add sticker', error: error.message });
  }
});

// ✅ DELETE STICKER (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const sticker = await Sticker.findByIdAndDelete(req.params.id);
    if (!sticker) {
      return res.status(404).json({ message: 'Sticker not found' });
    }
    res.json({ message: 'Sticker deleted', sticker });
  } catch (error) {
    console.error('Error deleting sticker:', error);
    res.status(500).json({ message: 'Failed to delete sticker', error: error.message });
  }
});

export default router;
