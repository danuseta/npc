const { Category, Product } = require('../models');
const { Op } = require('sequelize');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const slugify = require('../utils/helpers').slugify;

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'description', 'imageUrl', 'slug', 'parentId'],
      order: [['name', 'ASC']]
    });

    const hierarchical = req.query.hierarchical === 'true';
    
    if (hierarchical) {
      const rootCategories = categories.filter(cat => !cat.parentId);
      
      const categoriesWithChildren = rootCategories.map(category => {
        return {
          ...category.toJSON(),
          children: buildCategoryTree(categories, category.id)
        };
      });
      
      return res.status(200).json({
        success: true,
        count: rootCategories.length,
        data: categoriesWithChildren
      });
    }

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

const buildCategoryTree = (categories, parentId) => {
  const children = categories.filter(cat => cat.parentId === parentId);
  
  return children.map(child => {
    return {
      ...child.toJSON(),
      children: buildCategoryTree(categories, child.id)
    };
  });
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          as: 'children',
          attributes: ['id', 'name', 'slug', 'imageUrl']
        }
      ]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

exports.getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({
      where: { 
        slug: req.params.slug,
        isActive: true
      },
      include: [
        {
          model: Category,
          as: 'children',
          attributes: ['id', 'name', 'slug', 'imageUrl']
        }
      ]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category by slug',
      error: error.message
    });
  }
};

exports.getSubcategories = async (req, res) => {
  try {
    const { parentId } = req.params;
    
    if (parentId !== '0') {
      const parentCategory = await Category.findByPk(parentId);
      
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }
    
    const whereClause = parentId === '0' 
      ? { parentId: null, isActive: true } 
      : { parentId, isActive: true };
    
    const subcategories = await Category.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'description', 'imageUrl', 'slug'],
      order: [['name', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count: subcategories.length,
      data: subcategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategories',
      error: error.message
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, parentId } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    const existingCategory = await Category.findOne({
      where: { 
        name: { [Op.like]: name },
        isActive: true
      }
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    
    if (parentId) {
      const parentCategory = await Category.findByPk(parentId);
      
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }
    
    const slug = slugify(name);
    
    let imageUrl = null;
    let imagePublicId = null;
    
    if (req.file) {
      const result = await uploadMiddleware.uploadToCloudinary(
        req.file.path, 
        'categories'
      );
      
      imageUrl = result.url;
      imagePublicId = result.publicId;
    }
    
    const category = await Category.create({
      name,
      description,
      parentId: parentId || null,
      slug,
      imageUrl,
      imagePublicId
    });
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const { name, description, parentId, isActive } = req.body;
    
    if (parentId && parentId !== category.parentId) {
      if (parseInt(parentId) === parseInt(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent'
        });
      }
      
      const parentCategory = await Category.findByPk(parentId);
      
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }
      
      if (await isCircularReference(req.params.id, parentId)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot set a child category as the parent'
        });
      }
    }
    
    let slug = category.slug;
    if (name && name !== category.name) {
      slug = slugify(name);
    }
    
    let imageUrl = category.imageUrl;
    let imagePublicId = category.imagePublicId;
    
    if (req.file) {
      const result = await uploadMiddleware.uploadToCloudinary(
        req.file.path, 
        'categories'
      );
      
      if (category.imagePublicId) {
        await uploadMiddleware.deleteFromCloudinary(category.imagePublicId);
      }
      
      imageUrl = result.url;
      imagePublicId = result.publicId;
    }
    
    await category.update({
      name: name || category.name,
      description: description || category.description,
      parentId: parentId !== undefined ? parentId : category.parentId,
      isActive: isActive !== undefined ? isActive : category.isActive,
      slug,
      imageUrl,
      imagePublicId
    });
    
    const updatedCategory = await Category.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          as: 'children',
          attributes: ['id', 'name', 'slug', 'imageUrl']
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: updatedCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

const isCircularReference = async (categoryId, newParentId) => {
  const descendants = await getAllDescendants(categoryId);
  
  return descendants.includes(parseInt(newParentId));
};

const getAllDescendants = async (categoryId) => {
  const descendants = [];
  
  const children = await Category.findAll({
    where: { parentId: categoryId },
    attributes: ['id']
  });
  
  for (const child of children) {
    descendants.push(child.id);
    
    const childDescendants = await getAllDescendants(child.id);
    descendants.push(...childDescendants);
  }
  
  return descendants;
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const childrenCount = await Category.count({
      where: { parentId: req.params.id }
    });
    
    if (childrenCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Remove or reassign subcategories first.'
      });
    }
    
    const productsCount = await Product.count({
      where: { categoryId: req.params.id }
    });
    
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with products. Remove or reassign products first.'
      });
    }

    if (category.imagePublicId) {
      await uploadMiddleware.deleteFromCloudinary(category.imagePublicId);
    }

    await category.destroy();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};