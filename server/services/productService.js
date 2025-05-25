const { Product, Category, Review, User } = require('../models');
const { Op } = require('sequelize');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const { PAGINATION } = require('../utils/constants');

exports.getAllProducts = async (params) => {
  try {
    const page = parseInt(params.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(params.limit) || PAGINATION.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;
    const categoryId = params.category;
    const minPrice = params.minPrice;
    const maxPrice = params.maxPrice;
    const search = params.search;
    const sort = params.sort || 'createdAt';
    const order = params.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const includeInactive = params.includeInactive === 'true';
    
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
    return {
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        limit
      }
    };
  } catch (error) {
    throw error;
  }
};

exports.getProductById = async (id) => {
  try {
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Review,
          attributes: ['id', 'rating', 'title', 'comment', 'images', 'createdAt', 'isVerifiedPurchase', 'helpfulCount'],
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
      throw new Error('Product not found');
    }
    return product;
  } catch (error) {
    throw error;
  }
};

exports.getProductsByCategory = async (categoryId, params) => {
  try {
    const page = parseInt(params.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(params.limit) || PAGINATION.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;
    const category = await Category.findByPk(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }
    const { count, rows: products } = await Product.findAndCountAll({
      where: { 
        categoryId,
        isActive: true
      },
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'slug']
        }
      ],
      limit,
      offset
    });
    const totalPages = Math.ceil(count / limit);
    return {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug
      },
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        limit
      }
    };
  } catch (error) {
    throw error;
  }
};

exports.getFeaturedProducts = async (params) => {
  try {
    const limit = parseInt(params.limit) || 8;
    const products = await Product.findAll({
      where: { 
        isActive: true,
        featured: true
      },
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'slug']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit
    });
    return products;
  } catch (error) {
    throw error;
  }
};

exports.searchProducts = async (query, params) => {
  try {
    if (!query) {
      throw new Error('Search query is required');
    }
    const page = parseInt(params.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(params.limit) || PAGINATION.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;
    const { count, rows: products } = await Product.findAndCountAll({
      where: { 
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } }
        ],
        isActive: true
      },
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'slug']
        }
      ],
      limit,
      offset
    });
    const totalPages = Math.ceil(count / limit);
    return {
      query,
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        limit
      }
    };
  } catch (error) {
    throw error;
  }
};

exports.createProduct = async (productData, files) => {
  try {
    if (productData.categoryId) {
      const category = await Category.findByPk(productData.categoryId);
      if (!category) {
        throw new Error('Category not found');
      }
    }
    let imageUrl = null;
    let imagePublicId = null;
    let gallery = [];
    if (files && files.length > 0) {
      const mainImageResult = await uploadMiddleware.uploadToCloudinary(
        files[0].path,
        'products'
      );
      imageUrl = mainImageResult.url;
      imagePublicId = mainImageResult.publicId;
      if (files.length > 1) {
        for (let i = 1; i < files.length; i++) {
          const galleryResult = await uploadMiddleware.uploadToCloudinary(
            files[i].path,
            'products/gallery'
          );
          gallery.push({
            url: galleryResult.url,
            publicId: galleryResult.publicId
          });
        }
      }
    }
    const product = await Product.create({
      name: productData.name,
      description: productData.description,
      price: parseFloat(productData.price),
      stock: parseInt(productData.stock || 0),
      categoryId: productData.categoryId,
      sku: productData.sku,
      weight: productData.weight,
      dimensions: productData.dimensions,
      discountPercentage: parseFloat(productData.discountPercentage || 0),
      featured: productData.featured === 'true' || productData.featured === true,
      imageUrl,
      imagePublicId,
      gallery
    });
    return product;
  } catch (error) {
    throw error;
  }
};

exports.updateProduct = async (id, productData, files) => {
  try {
    const product = await Product.findByPk(id);
    if (!product) {
      throw new Error('Product not found');
    }
    if (productData.categoryId) {
      const category = await Category.findByPk(productData.categoryId);
      if (!category) {
        throw new Error('Category not found');
      }
    }
    let imageUrl = product.imageUrl;
    let imagePublicId = product.imagePublicId;
    let gallery = product.gallery || [];
    if (files && files.length > 0) {
      const mainImageResult = await uploadMiddleware.uploadToCloudinary(
        files[0].path,
        'products'
      );
      if (product.imagePublicId) {
        await uploadMiddleware.deleteFromCloudinary(product.imagePublicId);
      }
      imageUrl = mainImageResult.url;
      imagePublicId = mainImageResult.publicId;
      if (files.length > 1) {
        for (let i = 1; i < files.length; i++) {
          const galleryResult = await uploadMiddleware.uploadToCloudinary(
            files[i].path,
            'products/gallery'
          );
          gallery.push({
            url: galleryResult.url,
            publicId: galleryResult.publicId
          });
        }
      }
    }
    if (productData.removeImages && productData.removeImages.length) {
      const imagesToRemove = Array.isArray(productData.removeImages)
        ? productData.removeImages
        : productData.removeImages.split(',');
      const newGallery = [];
      for (const item of gallery) {
        if (!imagesToRemove.includes(item.publicId)) {
          newGallery.push(item);
        } else {
          await uploadMiddleware.deleteFromCloudinary(item.publicId);
        }
      }
      gallery = newGallery;
    }
    await product.update({
      name: productData.name || product.name,
      description: productData.description || product.description,
      price: productData.price ? parseFloat(productData.price) : product.price,
      stock: productData.stock !== undefined ? parseInt(productData.stock) : product.stock,
      categoryId: productData.categoryId || product.categoryId,
      sku: productData.sku || product.sku,
      isActive: productData.isActive !== undefined 
        ? (productData.isActive === 'true' || productData.isActive === true)
        : product.isActive,
      weight: productData.weight || product.weight,
      dimensions: productData.dimensions || product.dimensions,
      discountPercentage: productData.discountPercentage !== undefined 
        ? parseFloat(productData.discountPercentage)
        : product.discountPercentage,
      featured: productData.featured !== undefined 
        ? (productData.featured === 'true' || productData.featured === true)
        : product.featured,
      imageUrl,
      imagePublicId,
      gallery
    });
    const updatedProduct = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'slug']
        }
      ]
    });
    return updatedProduct;
  } catch (error) {
    throw error;
  }
};

exports.deleteProduct = async (id) => {
  try {
    const product = await Product.findByPk(id);
    if (!product) {
      throw new Error('Product not found');
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
    return true;
  } catch (error) {
    throw error;
  }
};

exports.hardDeleteProduct = async (id) => {
  try {
    const product = await Product.findByPk(id);
    if (!product) {
      throw new Error('Product not found');
    }
    if (product.imagePublicId) {
      await uploadMiddleware.deleteFromCloudinary(product.imagePublicId);
    }
    if (product.gallery && product.gallery.length > 0) {
      for (const image of product.gallery) {
        if (image.publicId) {
          await uploadMiddleware.deleteFromCloudinary(image.publicId);
        }
      }
    }
    await product.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};