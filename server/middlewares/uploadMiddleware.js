const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: 'dror0oa3z',
  api_key: '261585448195571',
  api_secret: 'rlGPZz-w7QWsOzmbN8kDg03dtoo',
  secure: true
});

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
    return cb(new Error('Only JPG and PNG image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: fileFilter
});

const uploadToCloudinary = async (filePath, folder = 'uploads') => {
  console.log(`Attempting to upload file to Cloudinary: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    console.error(`File doesn't exist at path: ${filePath}`);
    throw new Error(`File doesn't exist at path: ${filePath}`);
  }
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true,
      overwrite: true,
      transformation: [
        { quality: 'auto:good' },
        { width: 1000, height: 1000, crop: 'limit' }
      ]
    });
    console.log('Cloudinary upload successful:', {
      url: result.secure_url,
      publicId: result.public_id
    });
    try {
      fs.unlinkSync(filePath);
      console.log(`Deleted local file: ${filePath}`);
    } catch (unlinkError) {
      console.error(`Failed to delete local file ${filePath}:`, unlinkError);
    }
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.http_code,
      errorType: error.name
    });
    const fileName = path.basename(filePath);
    const publicUrl = `/uploads/${fileName}`;
    console.log(`Using local file fallback: ${publicUrl}`);
    return {
      url: publicUrl,
      publicId: fileName
    };
  }
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) {
    console.warn('No publicId provided for deletion');
    return { result: 'skipped' };
  }
  console.log(`Attempting to delete from Cloudinary: ${publicId}`);
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Cloudinary delete result:', result);
    return result;
  } catch (error) {
    console.error(`Error deleting from Cloudinary (${publicId}):`, error);
    throw new Error(`Error deleting from Cloudinary: ${error.message}`);
  }
};

const middleware = {
  productImages: upload.array('images', 10),
  productImagesEnhanced: (req, res, next) => {
    console.log('Running enhanced product images middleware');
    const uploadFields = upload.fields([
      { name: 'mainImage', maxCount: 1 },
      { name: 'galleryImages', maxCount: 10 }
    ]);
    uploadFields(req, res, function(err) {
      if (err) {
        console.error('Error uploading images:', err);
        return next(err);
      }
      req.productFiles = {
        mainImage: req.files.mainImage ? req.files.mainImage[0] : null,
        galleryImages: req.files.galleryImages || []
      };
      console.log('Product files processed:', {
        mainImage: req.productFiles.mainImage ? req.productFiles.mainImage.filename : 'none',
        galleryCount: req.productFiles.galleryImages.length
      });
      next();
    });
  },
  profileImage: upload.single('profileImage'),
  categoryImage: upload.single('categoryImage'),
  reviewImages: upload.array('reviewImages', 3),
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  testCloudinaryConnection: async () => {
    try {
      const testResult = await cloudinary.api.ping();
      return { success: true, message: 'Cloudinary connection successful', result: testResult };
    } catch (error) {
      return { success: false, message: 'Cloudinary connection failed', error: error.message };
    }
  }
};

module.exports = middleware;