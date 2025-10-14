const mongoose = require('mongoose');
require('dotenv').config();

const dbURI = process.env.MONGO_URI || process.env.MONGO_LOCAL || 'mongodb://127.0.0.1:27017/wpm_scheduler';

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(`Mongoose connected to ${dbURI}`))
  .catch(err => console.error('Mongoose connection error:', err));

mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected'));

const gracefulShutdown = async (msg, callback) => {
  try {
    await mongoose.connection.close();
    console.log(`Mongoose disconnected through ${msg}`);
  } catch (err) {
    console.error('Error during mongoose disconnect:', err);
  }
  if (typeof callback === 'function') callback();
};

process.once('SIGUSR2', () => gracefulShutdown('nodemon restart', () => process.kill(process.pid, 'SIGUSR2')));
process.on('SIGINT', () => gracefulShutdown('app termination', () => process.exit(0)));
process.on('SIGTERM', () => gracefulShutdown('app shutdown', () => process.exit(0)));

// Load models
require('./task');
require('./user');
