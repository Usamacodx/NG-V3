import express from 'express';
import Order from '../models/Order.js';
import { sendOrderPlacedEmail, sendOrderStatusEmail } from '../services/emailService.js';

const router = express.Router();

// Create an order
router.post('/', async (req, res) => {
  try {
    let payload = req.body;
    console.log('\n📦 NEW ORDER RECEIVED');
    
    if (!payload || !payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      return res.status(400).json({ message: 'Invalid order payload' });
    }

    // ✅ CRITICAL: Strip heavy base64 images from customization before saving to MongoDB
    // These should already be in Cloudinary — don't store raw base64 in MongoDB
    if (payload.items) {
      payload.items = payload.items.map(item => {
        if (item.customization && typeof item.customization === 'object') {
          // Keep only metadata, discard base64 images
          const { frontDesignImage, backDesignImage, ...cleanCustomization } = item.customization;
          item.customization = cleanCustomization;
          console.log(`   ✅ Stripped design images from item: ${item.name}`);
        }
        return item;
      });
    }

    const order = new Order(payload);
    const saved = await order.save();
    console.log('✅ Order saved to database:', saved._id);

    // Send order confirmation email to customer
    if (payload.address?.email) {
      console.log('📧 Order Email Details:');
      console.log('   Email:', payload.address.email);
      console.log('   Name:', payload.address.name);
      
      const emailResult = await sendOrderPlacedEmail(saved, payload.address.email);
      if (!emailResult.success) {
        console.warn('⚠️ Email notification failed but order was created:', emailResult.error);
      } else {
        console.log('✅ Email sent successfully!');
      }
    } else {
      console.warn('⚠️ No customer email provided in order address');
    }

    res.status(201).json({ message: 'Order created', order: saved });
  } catch (err) {
    console.error('❌ Error creating order', err.message);
    res.status(500).json({ message: 'Order creation failed', error: err.message });
  }
});

// Get all orders (admin) - OPTIMIZED
router.get('/admin', async (req, res) => {
  try {
    console.time('⏱️ Fetch admin orders');
    
    // ✅ Run both in parallel instead of sequential
    const [orders, totalCount] = await Promise.all([
      Order.find()
        .select('_id id total status createdAt address.name address.email address.phone') // ❌ NO items, NO designImage, NO customization
        .lean()
        .sort({ createdAt: -1 })
        .limit(20), // Reduced from 50
      Order.countDocuments()
    ]);
    
    console.log(`✅ Fetched ${orders.length}/${totalCount} orders`);
    console.timeEnd('⏱️ Fetch admin orders');
    
    res.json({ orders, total: totalCount });
  } catch (err) {
    console.error('Error fetching orders', err.message);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get orders for a user - OPTIMIZED
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId })
      .select('_id id total status createdAt address.name address.email') // ❌ NO items, NO customization
      .lean()
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ orders });
  } catch (err) {
    console.error('Error fetching user orders', err.message);
    res.status(500).json({ message: 'Failed to fetch user orders' });
  }
});

// Update order status - OPTIMIZED (single query instead of 2)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });

    // Single query: find and update in one operation
    const updated = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select('_id id status address createdAt'); // ✅ Only needed fields

    if (!updated) return res.status(404).json({ message: 'Order not found' });

    // Send status update email if status actually changed
    if (updated.address?.email) {
      const emailResult = await sendOrderStatusEmail(updated, updated.address.email, null, status);
      if (!emailResult.success) {
        console.warn('Status update email failed but order was updated:', emailResult.error);
      }
    }

    res.json({ message: 'Status updated', order: updated });
  } catch (err) {
    console.error('Error updating order status', err.message);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// Get single order with full details (items, design, etc)
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean(); // ✅ No need for .select() when fetching single order
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ order });
  } catch (err) {
    console.error('Error fetching order details', err.message);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

export default router;
