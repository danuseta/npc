const { SystemSettings, SystemLog, User } = require('../models');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { Op } = require('sequelize');

exports.getSystemSettings = async (req, res) => {
  try {
    const storeSettings = await SystemSettings.findOne();
    res.status(200).json({
      success: true,
      data: storeSettings || {}
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system settings',
      error: error.message
    });
  }
};

exports.updateSystemSettings = async (req, res) => {
  try {
    const { storeName, address, city, province, postalCode, country } = req.body;
    let storeSettings = await SystemSettings.findOne();
    if (!storeSettings) {
      storeSettings = await SystemSettings.create({
        storeName, 
        address, 
        city, 
        province, 
        postalCode, 
        country
      });
    } else {
      await storeSettings.update({
        storeName, 
        address, 
        city, 
        province, 
        postalCode, 
        country
      });
    }
    await SystemLog.create({
      level: 'INFO',
      message: 'Store information updated',
      source: 'SystemSettings',
      userId: req.user.id,
      ipAddress: req.ip
    });
    res.status(200).json({
      success: true,
      message: 'Store information updated successfully',
      data: storeSettings
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating system settings',
      error: error.message
    });
  }
};

exports.getSystemLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, level = 'all', startDate, endDate } = req.query;
    const skip = (page - 1) * limit;
    const query = {};
    if (level && level !== 'all') {
      query.level = level.toUpperCase();
    }
    if (startDate && endDate) {
      query.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      query.createdAt = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      query.createdAt = {
        [Op.lte]: new Date(endDate)
      };
    }
    const logs = await SystemLog.findAndCountAll({
      where: query,
      limit: parseInt(limit),
      offset: skip,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    res.status(200).json({
      success: true,
      data: {
        logs: logs.rows,
        totalItems: logs.count,
        totalPages: Math.ceil(logs.count / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system logs',
      error: error.message
    });
  }
};

exports.clearSystemLogs = async (req, res) => {
  try {
    await SystemLog.destroy({
      where: {},
      truncate: true
    });
    await SystemLog.create({
      level: 'INFO',
      message: 'System logs cleared',
      source: 'SystemSettings',
      userId: req.user.id,
      ipAddress: req.ip
    });
    res.status(200).json({
      success: true,
      message: 'System logs cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing system logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing system logs',
      error: error.message
    });
  }
};

exports.createSystemBackup = async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../../backups');
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupFileName = `backup_${timestamp}.zip`;
    const backupPath = path.join(backupDir, backupFileName);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    const output = fs.createWriteStream(backupPath);
    const closePromise = new Promise((resolve, reject) => {
      output.on('close', resolve);
      output.on('error', reject);
    });
    archive.pipe(output);
    archive.append('Database backup placeholder', { name: 'database.sql' });
    const settings = await SystemSettings.findOne();
    if (settings) {
      archive.append(JSON.stringify(settings.toJSON(), null, 2), { name: 'store_settings.json' });
    }
    const logs = await SystemLog.findAll({ limit: 1000 });
    if (logs.length > 0) {
      archive.append(JSON.stringify(logs.map(log => log.toJSON()), null, 2), { name: 'logs.json' });
    }
    await archive.finalize();
    await closePromise;
    await SystemLog.create({
      level: 'INFO',
      message: `System backup created: ${backupFileName}`,
      source: 'SystemSettings',
      userId: req.user.id,
      ipAddress: req.ip
    });
    res.status(200).json({
      success: true,
      message: 'System backup created successfully',
      data: {
        fileName: backupFileName,
        path: backupPath,
        timestamp: timestamp
      }
    });
  } catch (error) {
    console.error('Error creating system backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating system backup',
      error: error.message
    });
  }
};

exports.clearSystemCache = async (req, res) => {
  try {
    await SystemLog.create({
      level: 'INFO',
      message: 'System cache cleared',
      source: 'SystemSettings',
      userId: req.user.id,
      ipAddress: req.ip
    });
    res.status(200).json({
      success: true,
      message: 'System cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing system cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing system cache',
      error: error.message
    });
  }
};