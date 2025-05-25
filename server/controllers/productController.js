const { Product, Category, Review, User, OrderItem, Order } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database'); 
const uploadMiddleware = require('../middlewares/uploadMiddleware');

exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const categoryId = req.query.category;
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;
    const search = req.query.search;
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const includeInactive = req.query.includeInactive === 'true';

    const whereClause = includeInactive ? {} : { isActive: true };

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (minPrice && maxPrice) {
      whereClause.price = { [Op.between]: [minPrice, maxPrice] };
    } else if (minPrice) {
      whereClause.price = { [Op.gte]: minPrice };
    } else if (maxPrice) {
      whereClause.price = { [Op.lte]: maxPrice };
    }

    if (search) {
      whereClause.name = { [Op.like]: `%${search}%` };
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'slug']
        }
      ],
      order: [[sort, order]],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      count,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        limit
      },
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

exports.getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.count({
      where: { isActive: true }
    });
    const activeProducts = await Product.count({
      where: { isActive: true }
    });
    const inactiveProducts = await Product.count({
      where: { isActive: false }
    });
    const lowStockThreshold = 10;
    const lowStockProducts = await Product.count({
      where: { 
        stock: {
          [Op.lt]: lowStockThreshold
        },
        isActive: true
      }
    });
    const outOfStockProducts = await Product.count({
      where: { 
        stock: 0,
        isActive: true
      }
    });
    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        inactiveProducts,
        lowStockProducts,
        outOfStockProducts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product statistics',
      error: error.message
    });
  }
};

exports.getTopProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const topProducts = await OrderItem.findAll({
      attributes: [
        'productId',
        'productName',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold'],
        [sequelize.fn('SUM', sequelize.col('totalPrice')), 'totalRevenue']
      ],
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'imageUrl', 'price', 'stock']
        }
      ],
      group: ['productId', 'productName', 'Product.id'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit
    });
    const formattedTopProducts = topProducts.map(item => ({
      id: item.productId,
      name: item.productName,
      sold: parseInt(item.getDataValue('totalSold')) || 0,
      revenue: parseFloat(item.getDataValue('totalRevenue')) || 0,
      stock: item.Product ? item.Product.stock : 0,
      price: item.Product ? item.Product.price : 0,
      image: item.Product ? item.Product.imageUrl : null
    }));
    res.status(200).json({
      success: true,
      count: formattedTopProducts.length,
      products: formattedTopProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching top products',
      error: error.message
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Review,
          attributes: ['id', 'rating', 'title', 'comment', 'images', 'createdAt'],
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'profileImage']
            }
          ]
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const category = await Category.findByPk(categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const { count, rows: products } = await Product.findAndCountAll({
      where: { 
        categoryId,
        isActive: true
      },
      limit,
      offset,
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'slug']
        }
      ]
    });
    
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      count,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        limit
      },
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug
      },
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products by category',
      error: error.message
    });
  }
};

exports.getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    const products = await Product.findAll({
      where: { 
        isActive: true,
        featured: true
      },
      limit,
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'slug']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
      error: error.message
    });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const { count, rows: products } = await Product.findAndCountAll({
      where: { 
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } }
        ],
        isActive: true
      },
      limit,
      offset,
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'slug']
        }
      ]
    });
    
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      count,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        limit
      },
      query,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching products',
      error: error.message
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    console.log('Create product request received');
    console.log('Body request:', req.body);
    console.log('Files structure:', req.productFiles ? 
      {
        mainImage: req.productFiles.mainImage ? req.productFiles.mainImage.filename : 'none',
        galleryCount: req.productFiles.galleryImages.length
      } : 'Old middleware structure');
    
    const { 
      name, 
      description, 
      price, 
      stock, 
      categoryId, 
      sku,
      weight,
      dimensions,
      discountPercentage,
      featured,
      isActive
    } = req.body;

    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    let imageUrl = null;
    let imagePublicId = null;
    let gallery = [];

    if (req.productFiles) {
      try {
        if (req.productFiles.mainImage) {
          console.log('Processing main image:', req.productFiles.mainImage.path);
          const mainImageResult = await uploadMiddleware.uploadToCloudinary(
            req.productFiles.mainImage.path, 
            'products'
          );
          console.log('Main image upload result:', mainImageResult);
          imageUrl = mainImageResult.url;
          imagePublicId = mainImageResult.publicId;
        }
        if (req.productFiles.galleryImages && req.productFiles.galleryImages.length > 0) {
          console.log(`Processing ${req.productFiles.galleryImages.length} gallery images`);
          for (const galleryImage of req.productFiles.galleryImages) {
            try {
              console.log('Processing gallery image:', galleryImage.path);
              const galleryResult = await uploadMiddleware.uploadToCloudinary(
                galleryImage.path, 
                'products/gallery'
              );
              gallery.push({
                url: galleryResult.url,
                publicId: galleryResult.publicId
              });
              console.log('Gallery image uploaded:', galleryResult.url);
            } catch (galleryError) {
              console.error('Error uploading gallery image:', galleryError);
            }
          }
        }
      } catch (imageError) {
        console.error('Error processing images:', imageError);
      }
    } else if (req.files && req.files.length > 0) {
      try {
        console.log('Using old middleware structure');
        console.log('Total image files:', req.files.length);
        console.log('Processing main image:', req.files[0].path);
        const mainImageResult = await uploadMiddleware.uploadToCloudinary(
          req.files[0].path, 
          'products'
        );
        console.log('Main image upload result:', mainImageResult);
        imageUrl = mainImageResult.url;
        imagePublicId = mainImageResult.publicId;
        if (req.files.length > 1) {
          console.log(`Processing ${req.files.length - 1} gallery images`);
          for (let i = 1; i < req.files.length; i++) {
            try {
              console.log(`Processing gallery image ${i}:`, req.files[i].path);
              const galleryResult = await uploadMiddleware.uploadToCloudinary(
                req.files[i].path, 
                'products/gallery'
              );
              gallery.push({
                url: galleryResult.url,
                publicId: galleryResult.publicId
              });
              console.log(`Gallery image ${i} uploaded:`, galleryResult.url);
            } catch (galleryError) {
              console.error(`Error uploading gallery image ${i}:`, galleryError);
            }
          }
        }
      } catch (imageError) {
        console.error('Error processing images:', imageError);
      }
    } else {
      console.log('No image files received');
    }

    let parsedFeatures = [];
    let parsedSpecifications = {};
    if (req.body.features) {
      try {
        console.log('Features before parsing:', req.body.features);
        parsedFeatures = typeof req.body.features === 'string' 
          ? JSON.parse(req.body.features) 
          : req.body.features;
        console.log('Features after parsing:', parsedFeatures);
      } catch (error) {
        console.error('Error parsing features:', error);
        console.error('Features raw value:', req.body.features);
      }
    }
    if (req.body.specifications) {
      try {
        console.log('Specifications before parsing:', req.body.specifications);
        parsedSpecifications = typeof req.body.specifications === 'string' 
          ? JSON.parse(req.body.specifications) 
          : req.body.specifications;
        console.log('Specifications after parsing:', parsedSpecifications);
      } catch (error) {
        console.error('Error parsing specifications:', error);
        console.error('Specifications raw value:', req.body.specifications);
      }
    }

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price) || 0,
      stock: parseInt(stock) || 0,
      categoryId,
      sku,
      weight,
      dimensions,
      discountPercentage: parseFloat(discountPercentage) || 0,
      featured: featured === 'true' || featured === true,
      isActive: isActive === 'true' || isActive === true,
      imageUrl,
      imagePublicId,
      gallery,
      features: parsedFeatures,
      specifications: parsedSpecifications
    });

    console.log('Product created successfully with ID:', product.id);
    console.log('Gallery saved:', gallery);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

exports.getPopularProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const topProducts = await OrderItem.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'totalSold']
      ],
      include: [
        {
          model: Order,
          attributes: [],
          where: { paymentStatus: 'paid' },
          required: true
        },
        {
          model: Product,
          attributes: ['id', 'name', 'imageUrl', 'price', 'stock', 'discountPercentage', 'avgRating', 'reviewCount'],
          include: [{
            model: Category,
            attributes: ['id', 'name']
          }],
          where: { isActive: true },
          required: true
        }
      ],
      group: ['OrderItem.productId', 'Product.id', 'Product->Category.id'],
      order: [[sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'DESC']],
      having: sequelize.where(sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), '>', 0),
      limit,
      raw: false
    });
    const formattedProducts = topProducts
      .filter(item => item.Product)
      .map(item => ({
        id: item.Product.id,
        name: item.Product.name,
        imageUrl: item.Product.imageUrl,
        price: item.Product.price,
        discountPercentage: item.Product.discountPercentage,
        stock: item.Product.stock,
        avgRating: item.Product.avgRating,
        reviewCount: item.Product.reviewCount,
        category: item.Product.Category ? item.Product.Category.name : 'Uncategorized',
        totalSold: parseInt(item.getDataValue('totalSold')) || 0
      }));
    res.status(200).json({
      success: true,
      count: formattedProducts.length,
      data: formattedProducts
    });
  } catch (error) {
    console.error('Error in getPopularProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular products',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    console.log('Update product request received:', req.params.id);
    console.log('Body:', req.body);
    console.log('Files structure:', req.productFiles ? 
      {
        mainImage: req.productFiles.mainImage ? req.productFiles.mainImage.filename : 'none',
        galleryCount: req.productFiles.galleryImages.length
      } : 'Old middleware structure');
    
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const { 
      name, 
      description, 
      price, 
      stock, 
      categoryId, 
      sku,
      isActive,
      weight,
      dimensions,
      discountPercentage,
      featured,
      removeImages
    } = req.body;

    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    let imageUrl = product.imageUrl;
    let imagePublicId = product.imagePublicId;
    let gallery = product.gallery || [];

    if (req.productFiles) {
      try {
        if (req.productFiles.mainImage) {
          console.log('Processing main image:', req.productFiles.mainImage.path);
          if (product.imagePublicId) {
            console.log('Deleting old main image:', product.imagePublicId);
            await uploadMiddleware.deleteFromCloudinary(product.imagePublicId);
          }
          const mainImageResult = await uploadMiddleware.uploadToCloudinary(
            req.productFiles.mainImage.path, 
            'products'
          );
          console.log('Main image upload result:', mainImageResult);
          imageUrl = mainImageResult.url;
          imagePublicId = mainImageResult.publicId;
        }
        if (req.productFiles.galleryImages && req.productFiles.galleryImages.length > 0) {
          console.log(`Processing ${req.productFiles.galleryImages.length} gallery images`);
          for (const galleryImage of req.productFiles.galleryImages) {
            try {
              console.log('Processing gallery image:', galleryImage.path);
              const galleryResult = await uploadMiddleware.uploadToCloudinary(
                galleryImage.path, 
                'products/gallery'
              );
              gallery.push({
                url: galleryResult.url,
                publicId: galleryResult.publicId
              });
              console.log('Gallery image uploaded:', galleryResult.url);
            } catch (galleryError) {
              console.error('Error uploading gallery image:', galleryError);
            }
          }
        }
      } catch (imageError) {
        console.error('Error processing images:', imageError);
      }
    } else if (req.files && req.files.length > 0) {
      try {
        console.log('Using old middleware structure');
        console.log('Processing main image:', req.files[0].path);
        if (product.imagePublicId) {
          console.log('Deleting old main image:', product.imagePublicId);
          await uploadMiddleware.deleteFromCloudinary(product.imagePublicId);
        }
        const mainImageResult = await uploadMiddleware.uploadToCloudinary(
          req.files[0].path, 
          'products'
        );
        console.log('Main image upload result:', mainImageResult);
        imageUrl = mainImageResult.url;
        imagePublicId = mainImageResult.publicId;
        if (req.files.length > 1) {
          console.log(`Processing ${req.files.length - 1} gallery images`);
          for (let i = 1; i < req.files.length; i++) {
            try {
              console.log(`Processing gallery image ${i}:`, req.files[i].path);
              const galleryResult = await uploadMiddleware.uploadToCloudinary(
                req.files[i].path, 
                'products/gallery'
              );
              gallery.push({
                url: galleryResult.url,
                publicId: galleryResult.publicId
              });
              console.log(`Gallery image ${i} uploaded:`, galleryResult.url);
            } catch (galleryError) {
              console.error(`Error uploading gallery image ${i}:`, galleryError);
            }
          }
        }
      } catch (imageError) {
        console.error('Error processing images:', imageError);
      }
    }

    if (removeImages && removeImages.length) {
      const imagesToRemove = Array.isArray(removeImages) 
        ? removeImages 
        : removeImages.split(',');
      console.log('Removing images from gallery:', imagesToRemove);
      const newGallery = [];
      for (const item of gallery) {
        if (!imagesToRemove.includes(item.publicId)) {
          newGallery.push(item);
        } else {
          console.log('Deleting gallery image:', item.publicId);
          await uploadMiddleware.deleteFromCloudinary(item.publicId);
        }
      }
      gallery = newGallery;
    }

    let parsedFeatures = product.features || [];
    let parsedSpecifications = product.specifications || {};
    if (req.body.features) {
      try {
        console.log('Features before parsing:', req.body.features);
        parsedFeatures = typeof req.body.features === 'string' 
          ? JSON.parse(req.body.features) 
          : req.body.features;
        console.log('Features after parsing:', parsedFeatures);
      } catch (error) {
        console.error('Error parsing features:', error);
        console.error('Features raw value:', req.body.features);
      }
    }
    if (req.body.specifications) {
      try {
        console.log('Specifications before parsing:', req.body.specifications);
        parsedSpecifications = typeof req.body.specifications === 'string' 
          ? JSON.parse(req.body.specifications) 
          : req.body.specifications;
        console.log('Specifications after parsing:', parsedSpecifications);
      } catch (error) {
        console.error('Error parsing specifications:', error);
        console.error('Specifications raw value:', req.body.specifications);
      }
    }

    await product.update({
      name: name || product.name,
      description: description || product.description,
      price: price ? parseFloat(price) : product.price,
      stock: stock !== undefined ? parseInt(stock) : product.stock,
      categoryId: categoryId || product.categoryId,
      sku: sku || product.sku,
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : product.isActive,
      weight: weight || product.weight,
      dimensions: dimensions || product.dimensions,
      discountPercentage: discountPercentage !== undefined ? parseFloat(discountPercentage) : product.discountPercentage,
      featured: featured !== undefined ? (featured === 'true' || featured === true) : product.featured,
      imageUrl,
      imagePublicId,
      gallery,
      features: parsedFeatures,
      specifications: parsedSpecifications
    });

    console.log('Product updated successfully:', product.id);
    console.log('Gallery after update:', gallery);

    const updatedProduct = await Product.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.imagePublicId) {
      try {
        await uploadMiddleware.deleteFromCloudinary(product.imagePublicId);
      } catch (cloudinaryError) {
        console.error('Error deleting main image from Cloudinary:', cloudinaryError);
      }
    }

    if (product.gallery && product.gallery.length > 0) {
      for (const image of product.gallery) {
        if (image.publicId) {
          try {
            await uploadMiddleware.deleteFromCloudinary(image.publicId);
          } catch (cloudinaryError) {
            console.error('Error deleting gallery image from Cloudinary:', cloudinaryError);
          }
        }
      }
    }

    await product.destroy();

    res.status(200).json({
      success: true,
      message: 'Product deleted permanently'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};