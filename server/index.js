const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const sequelize = require('./config/database');

const routes = require('./routes');

const orderCleanupService = require('./services/orderCleanupService');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: process.env.NODE_ENV === 'development' })
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      
      orderCleanupService.start();
      console.log('Order cleanup service has been started');
    });
    
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      
      orderCleanupService.stop();
      console.log('Order cleanup service has been stopped');
      
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing HTTP server');
      
      orderCleanupService.stop();
      console.log('Order cleanup service has been stopped');
      
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
  })
  .catch(err => {
    console.error('Failed to sync database:', err);
  });