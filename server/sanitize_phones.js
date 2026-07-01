const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config({ path: './.env' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to DB');
  const users = await User.find({ phone: { $ne: '' } });
  let count = 0;
  for (let user of users) {
    if (user.phone) {
      const cleaned = user.phone.replace(/[\s-()]/g, '');
      if (cleaned !== user.phone) {
        user.phone = cleaned;
        await user.save();
        count++;
      }
    }
  }
  console.log(`Cleaned ${count} phone numbers`);
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
