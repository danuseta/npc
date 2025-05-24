const { Carousel } = require('../models');
const fs = require('fs');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

exports.getAllSlides = async (req, res) => {
  try {
    let filter = { isActive: true };
    
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
      filter = {};
    }

    if (req.query.includeInactive === 'true') {
      filter = {};
    }
    
    const slides = await Carousel.findAll({
      where: filter,
      order: [['displayOrder', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count: slides.length,
      data: slides
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving carousel data',
      error: error.message
    });
  }
};

exports.getSlideById = async (req, res) => {
  try {
    const slide = await Carousel.findByPk(req.params.id);
    
    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Slide not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: slide
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving slide data',
      error: error.message
    });
  }
};

exports.createSlide = async (req, res) => {
  try {
    const { title, description, tag, buttonText, buttonLink, displayOrder, isActive } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image for the slide'
      });
    }
    
    const result = await uploadMiddleware.uploadToCloudinary(
      req.file.path, 
      'carousel'
    );
    
    const slide = await Carousel.create({
      title,
      description,
      tag,
      buttonText,
      buttonLink,
      imageUrl: result.url,
      imagePublicId: result.publicId,
      displayOrder: displayOrder || 0,
      isActive: isActive === undefined ? true : isActive
    });
    
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(201).json({
      success: true,
      data: slide,
      message: 'Carousel slide created successfully'
    });
  } catch (error) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating carousel slide',
      error: error.message
    });
  }
};

exports.updateSlide = async (req, res) => {
  try {
    const { title, description, tag, buttonText, buttonLink, displayOrder, isActive } = req.body;
    
    const slide = await Carousel.findByPk(req.params.id);
    
    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Slide not found'
      });
    }
    
    slide.title = title || slide.title;
    slide.description = description !== undefined ? description : slide.description;
    slide.tag = tag !== undefined ? tag : slide.tag;
    slide.buttonText = buttonText || slide.buttonText;
    slide.buttonLink = buttonLink || slide.buttonLink;
    slide.displayOrder = displayOrder !== undefined ? displayOrder : slide.displayOrder;
    slide.isActive = isActive !== undefined ? isActive : slide.isActive;
    
    if (req.file) {
      const result = await uploadMiddleware.uploadToCloudinary(
        req.file.path, 
        'carousel'
      );
      
      if (slide.imagePublicId) {
        await uploadMiddleware.deleteFromCloudinary(slide.imagePublicId);
      }
      
      slide.imageUrl = result.url;
      slide.imagePublicId = result.publicId;
      
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
    
    await slide.save();
    
    res.status(200).json({
      success: true,
      data: slide,
      message: 'Carousel slide updated successfully'
    });
  } catch (error) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating carousel slide',
      error: error.message
    });
  }
};

exports.deleteSlide = async (req, res) => {
  try {
    const slide = await Carousel.findByPk(req.params.id);
    
    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Slide not found'
      });
    }
    
    if (slide.imagePublicId) {
      await uploadMiddleware.deleteFromCloudinary(slide.imagePublicId);
    }
    
    await slide.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Carousel slide deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting carousel slide',
      error: error.message
    });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { slides } = req.body;
    
    if (!slides || !Array.isArray(slides)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Array of objects with id and displayOrder required'
      });
    }
    
    const updatePromises = slides.map(item => {
      return Carousel.update(
        { displayOrder: item.displayOrder },
        { where: { id: item.id } }
      );
    });
    
    await Promise.all(updatePromises);
    
    res.status(200).json({
      success: true,
      message: 'Slide order updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating slide order',
      error: error.message
    });
  }
};

exports.toggleActive = async (req, res) => {
  try {
    const slide = await Carousel.findByPk(req.params.id);
    
    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Slide not found'
      });
    }
    
    slide.isActive = !slide.isActive;
    await slide.save();
    
    res.status(200).json({
      success: true,
      data: slide,
      message: `Carousel slide successfully ${slide.isActive ? 'activated' : 'deactivated'}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error changing slide status',
      error: error.message
    });
  }
};