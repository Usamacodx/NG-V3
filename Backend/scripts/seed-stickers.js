import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Sticker from '../models/Sticker.js';

dotenv.config();

// Popular stickers from Flaticon
const initialStickers = [
  {
    name: 'Location',
    keywords: ['star', 'special', 'celebration'],
    url: 'https://cdn-icons-png.flaticon.com/512/1144/1144687.png',
    cloudinaryId: 'stickers/location',
    category: 'celebration',
  },
  {
    name: 'Red Heart',
    keywords: ['heart', 'love', 'romantic', 'valentine'],
    url: 'https://cdn-icons-png.flaticon.com/512/833/833472.png',
    cloudinaryId: 'stickers/red-heart',
    category: 'love',
  },
  {
    name: 'Doctor',
    keywords: ['smile', 'happy', 'face', 'emoji'],
    url: 'https://cdn-icons-png.flaticon.com/512/2752/2752090.png',
    cloudinaryId: 'stickers/doctor',
    category: 'emoji',
  },
  {
    name: 'Lightning Bolt',
    keywords: ['thunder', 'lightning', 'bolt', 'power', 'energy'],
    url: 'https://cdn-icons-png.flaticon.com/512/414/414927.png',
    cloudinaryId: 'stickers/lightning-bolt',
    category: 'nature',
  },
  {
    name: 'Musical Note',
    keywords: ['music', 'note', 'sound', 'audio'],
    url: 'https://cdn-icons-png.flaticon.com/512/2922/2922500.png',
    cloudinaryId: 'stickers/musical-note',
    category: 'music',
  },
  {
    name: 'Leaf',
    keywords: ['leaf', 'nature', 'green', 'plant', 'tree'],
    url: 'https://cdn-icons-png.flaticon.com/512/714/714534.png',
    cloudinaryId: 'stickers/leaf',
    category: 'nature',
  },
  {
    name: 'Flower',
    keywords: ['flower', 'floral', 'bloom', 'garden'],
    url: 'https://cdn-icons-png.flaticon.com/512/2540/2540275.png',
    cloudinaryId: 'stickers/flower',
    category: 'nature',
  },
  {
    name: 'Snowflake',
    keywords: ['snowflake', 'winter', 'christmas', 'cold'],
    url: 'https://cdn-icons-png.flaticon.com/512/414/414999.png',
    cloudinaryId: 'stickers/snowflake',
    category: 'winter',
  },
  {
    name: 'Birthday Cake',
    keywords: ['birthday', 'cake', 'party', 'celebrate'],
    url: 'https://cdn-icons-png.flaticon.com/512/924/924514.png',
    cloudinaryId: 'stickers/birthday-cake',
    category: 'celebration',
  },
  {
    name: 'Balloon',
    keywords: ['balloon', 'birthday', 'party', 'celebration'],
    url: 'https://cdn-icons-png.flaticon.com/512/1995/1995567.png',
    cloudinaryId: 'stickers/balloon',
    category: 'celebration',
  },
  {
    name: 'Gift',
    keywords: ['gift', 'present', 'birthday', 'box'],
    url: 'https://cdn-icons-png.flaticon.com/512/1762/1762506.png',
    cloudinaryId: 'stickers/gift',
    category: 'celebration',
  },
  {
    name: 'Crown',
    keywords: ['crown', 'royal', 'king', 'queen', 'anniversary'],
    url: 'https://cdn-icons-png.flaticon.com/512/1462/1462133.png',
    cloudinaryId: 'stickers/crown',
    category: 'royal',
  },
  {
    name: 'Sun',
    keywords: ['sun', 'sunshine', 'bright', 'warm'],
    url: 'https://cdn-icons-png.flaticon.com/512/681/681494.png',
    cloudinaryId: 'stickers/sun',
    category: 'nature',
  },
  {
    name: 'Sparkle',
    keywords: ['sparkle', 'shine', 'glitter', 'special'],
    url: 'https://cdn-icons-png.flaticon.com/512/747/747376.png',
    cloudinaryId: 'stickers/sparkle',
    category: 'special',
  },
  {
    name: 'Fire',
    keywords: ['fire', 'flame', 'hot', 'burn', 'cool'],
    url: 'https://cdn-icons-png.flaticon.com/512/414/414927.png',
    cloudinaryId: 'stickers/fire',
    category: 'nature',
  },
  {
    name: 'Cloud',
    keywords: ['cloud', 'weather', 'sky', 'blue'],
    url: 'https://cdn-icons-png.flaticon.com/512/822/822144.png',
    cloudinaryId: 'stickers/cloud',
    category: 'weather',
  },
  {
    name: 'Rainbow',
    keywords: ['rainbow', 'colors', 'spectrum'],
    url: 'https://cdn-icons-png.flaticon.com/512/1087/1087840.png',
    cloudinaryId: 'stickers/rainbow',
    category: 'nature',
  },
  {
    name: 'Butterfly',
    keywords: ['butterfly', 'insect', 'nature'],
    url: 'https://cdn-icons-png.flaticon.com/512/921/921489.png',
    cloudinaryId: 'stickers/butterfly',
    category: 'nature',
  },
  {
    name: 'Paw',
    keywords: ['paw', 'pet', 'animal', 'dog', 'cat'],
    url: 'https://cdn-icons-png.flaticon.com/512/616/616408.png',
    cloudinaryId: 'stickers/paw',
    category: 'animal',
  },
  {
    name: 'Camera',
    keywords: ['camera', 'photo', 'vintage', 'picture'],
    url: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png',
    cloudinaryId: 'stickers/camera',
    category: 'misc',
  },
];

async function seedStickers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Check if stickers already exist
    const existingCount = await Sticker.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  ${existingCount} stickers already exist. Skipping seed.`);
      return;
    }

    // Insert stickers
    const inserted = await Sticker.insertMany(initialStickers);
    console.log(`✅ ${inserted.length} stickers added to database`);

    // Display summary
    console.log('\n📊 Stickers by Category:');
    const categories = await Sticker.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    categories.forEach(cat => {
      console.log(`  ${cat._id}: ${cat.count}`);
    });
  } catch (error) {
    console.error('❌ Error seeding stickers:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

seedStickers();
