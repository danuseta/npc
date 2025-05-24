const { Category, Product } = require('../models');
const { Op } = require('sequelize');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const { slugify } = require('../utils/helpers');
const { PAGINATION } = require('../utils/constants');

exports.getAllCategories = async (params) => {
  try {
    const hierarchical = params.hierarchical === 'true';
    const categories = await Category.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'description', 'imageUrl', 'slug', 'parentId'],
      order: [['name', 'ASC']]
    });
    if (!hierarchical) {
      return categories;
    }
    const rootCategories = categories.filter(cat => !cat.parentId);
    const categoriesWithChildren = rootCategories.map(category => {
      return {
        ...category.toJSON(),
        children: buildCategoryTree(categories, category.id)
      };
    });
    return categoriesWithChildren;
  } catch (error) {
    throw error;
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

exports.getCategoryById = async (id) => {
  try {
    const category = await Category.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'children',
          attributes: ['id', 'name', 'slug', 'imageUrl']
        }
      ]
    });
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  } catch (error) {
    throw error;
  }
};

exports.getCategoryBySlug = async (slug) => {
  try {
    const category = await Category.findOne({
      where: { 
        slug,
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
      throw new Error('Category not found');
    }
    return category;
  } catch (error) {
    throw error;
  }
};

exports.getSubcategories = async (parentId) => {
  try {
    const whereClause = parentId === '0' 
      ? { parentId: null, isActive: true } 
      : { parentId, isActive: true };
    if (parentId !== '0') {
      const parentCategory = await Category.findByPk(parentId);
      if (!parentCategory) {
        throw new Error('Parent category not found');
      }
    }
    const subcategories = await Category.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'description', 'imageUrl', 'slug'],
      order: [['name', 'ASC']]
    });
    return subcategories;
  } catch (error) {
    throw error;
  }
};

exports.createCategory = async (categoryData, file) => {
  try {
    const { name, description, parentId } = categoryData;
    if (!name) {
      throw new Error('Category name is required');
    }
    const existingCategory = await Category.findOne({
      where: { 
        name: { [Op.like]: name },
        isActive: true
      }
    });
    if (existingCategory) {
      throw new Error('Category with this name already exists');
    }
    if (parentId) {
      const parentCategory = await Category.findByPk(parentId);
      if (!parentCategory) {
        throw new Error('Parent category not found');
      }
    }
    const slug = slugify(name);
    let imageUrl = null;
    let imagePublicId = null;
    if (file) {
      const result = await uploadMiddleware.uploadToCloudinary(
        file.path, 
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
    return category;
  } catch (error) {
    throw error;
  }
};

exports.updateCategory = async (id, categoryData, file) => {
  try {
    const { name, description, parentId, isActive } = categoryData;
    const category = await Category.findByPk(id);
    if (!category) {
      throw new Error('Category not found');
    }
    if (parentId && parentId !== category.parentId) {
      if (parseInt(parentId) === parseInt(id)) {
        throw new Error('Category cannot be its own parent');
      }
      const parentCategory = await Category.findByPk(parentId);
      if (!parentCategory) {
        throw new Error('Parent category not found');
      }
      if (await isCircularReference(id, parentId)) {
        throw new Error('Cannot set a child category as the parent');
      }
    }
    let slug = category.slug;
    if (name && name !== category.name) {
      slug = slugify(name);
    }
    let imageUrl = category.imageUrl;
    let imagePublicId = category.imagePublicId;
    if (file) {
      const result = await uploadMiddleware.uploadToCloudinary(
        file.path, 
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
    const updatedCategory = await Category.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'children',
          attributes: ['id', 'name', 'slug', 'imageUrl']
        }
      ]
    });
    return updatedCategory;
  } catch (error) {
    throw error;
  }
};

exports.deleteCategory = async (id) => {
  try {
    const category = await Category.findByPk(id);
    if (!category) {
      throw new Error('Category not found');
    }
    const childrenCount = await Category.count({
      where: { parentId: id }
    });
    if (childrenCount > 0) {
      throw new Error('Cannot delete category with subcategories. Remove or reassign subcategories first.');
    }
    const productsCount = await Product.count({
      where: { categoryId: id }
    });
    if (productsCount > 0) {
      throw new Error('Cannot delete category with products. Remove or reassign products first.');
    }
    if (category.imagePublicId) {
      await uploadMiddleware.deleteFromCloudinary(category.imagePublicId);
    }
    await category.destroy();
    return true;
  } catch (error) {
    throw error;
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