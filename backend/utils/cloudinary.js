const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
// Support both CLOUDINARY_URL and individual credentials
if (process.env.CLOUDINARY_URL) {
    cloudinary.config();
    console.log('✅ Cloudinary configured using CLOUDINARY_URL');
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log('✅ Cloudinary configured using individual credentials');
} else {
    console.warn('⚠️  Cloudinary not configured! Please set CLOUDINARY_URL or individual credentials in .env');
}

// Upload image to Cloudinary
const uploadToCloudinary = async (file, folder = 'travelnest') => {
    try {
        if (!file || !file.path) {
            throw new Error('Invalid file object');
        }

        console.log(`Uploading to Cloudinary: ${file.originalname} (${file.size} bytes)`);
        
        const result = await cloudinary.uploader.upload(file.path, {
            folder: folder,
            resource_type: 'auto',
            transformation: [
                { width: 1200, height: 800, crop: 'limit', quality: 'auto' }
            ]
        });
        
        console.log(`✅ Upload successful: ${result.secure_url}`);
        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        const errorMsg = error.message || 'Unknown error';
        if (errorMsg.includes('Invalid cloud_name') || errorMsg.includes('Unauthorized')) {
            throw new Error('Cloudinary configuration error. Please check your .env file.');
        }
        throw new Error(`Failed to upload image to Cloudinary: ${errorMsg}`);
    }
};

// Upload multiple images
const uploadMultipleToCloudinary = async (files, folder = 'travelnest') => {
    try {
        const uploadPromises = files.map(file => uploadToCloudinary(file, folder));
        const urls = await Promise.all(uploadPromises);
        return urls;
    } catch (error) {
        console.error('Cloudinary multiple upload error:', error);
        throw new Error('Failed to upload images to Cloudinary');
    }
};

// Upload document (for license)
const uploadDocumentToCloudinary = async (file, folder = 'travelnest/licenses') => {
    try {
        if (!file || !file.path) {
            throw new Error('Invalid file object');
        }

        console.log(`Uploading document to Cloudinary: ${file.originalname} (${file.size} bytes)`);
        
        const result = await cloudinary.uploader.upload(file.path, {
            folder: folder,
            resource_type: 'auto',
            allowed_formats: ['pdf', 'jpg', 'jpeg', 'png']
        });
        
        console.log(`✅ Document upload successful: ${result.secure_url}`);
        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary document upload error:', error);
        const errorMsg = error.message || 'Unknown error';
        if (errorMsg.includes('Invalid cloud_name') || errorMsg.includes('Unauthorized')) {
            throw new Error('Cloudinary configuration error. Please check your .env file.');
        }
        throw new Error(`Failed to upload document to Cloudinary: ${errorMsg}`);
    }
};

module.exports = {
    cloudinary,
    uploadToCloudinary,
    uploadMultipleToCloudinary,
    uploadDocumentToCloudinary
};

