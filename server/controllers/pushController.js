const PushSubscription = require('../models/PushSubscription');
const webpush = require('web-push');

// In production, these should be in .env
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuB2bYwA4E8hC2E2x2sYw8T-T4';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'yA_N_W6zO4gK43T-83Yw9H2c3l1v0Y7P7A8V9mP0T4s';

webpush.setVapidDetails(
  'mailto:test@example.com',
  publicVapidKey,
  privateVapidKey
);

exports.subscribe = async (req, res) => {
  try {
    const subscription = req.body;
    
    // Check if subscription already exists
    let sub = await PushSubscription.findOne({ endpoint: subscription.endpoint });
    
    if (!sub) {
      sub = await PushSubscription.create({
        userId: req.user._id,
        endpoint: subscription.endpoint,
        keys: subscription.keys
      });
    }

    res.status(201).json({});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
};

exports.getVapidPublicKey = (req, res) => {
  res.json({ publicKey: publicVapidKey });
};
