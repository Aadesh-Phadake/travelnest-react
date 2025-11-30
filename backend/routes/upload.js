const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const { uploadToCloudinary, uploadMultipleToCloudinary, uploadDocumentToCloudinary } = require('../utils/cloudinary');
const { isLoggedIn } = require('../middleware');
const fs = require('fs');
const path = require('path');

// Error handler wrapper for multer
const handleUpload = (uploadMiddleware) => {
    return (req, res, next) => {
        uploadMiddleware(req, res, (err) => {
            if (err) {
                console.error('Multer error:', err);
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ 
                        success: false,
                        message: 'File too large. Maximum size is 10MB.' 
                    });
                }
                if (err.message && err.message.includes('Only image files and PDFs')) {
                    return res.status(400).json({ 
                        success: false,
                        message: 'Invalid file type. Only images and PDFs are allowed.' 
                    });
                }
                return res.status(400).json({ 
                    success: false,
                    message: err.message || 'File upload error' 
                });
            }
            next();
        });
    };
};

// Upload single image
router.post('/image', isLoggedIn, handleUpload(upload.single('image')), async (req, res) => {
    try {
        console.log('Single image upload request:', {
            hasFile: !!req.file,
            fileInfo: req.file ? { name: req.file.originalname, size: req.file.size, path: req.file.path } : null,
            user: req.user ? req.user.username : 'No user'
        });

        if (!req.file) {
            console.error('No file received in request');
            return res.status(400).json({ 
                success: false,
                message: 'No image file provided' 
            });
        }

        const imageUrl = await uploadToCloudinary(req.file);
        
        // Delete local file after upload
        fs.unlinkSync(req.file.path);

        res.status(200).json({ 
            success: true, 
            url: imageUrl 
        });
    } catch (error) {
        console.error('Upload error:', error);
        // Clean up local file if upload fails
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to upload image',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Upload multiple images
router.post('/images', isLoggedIn, handleUpload(upload.array('images', 20)), async (req, res) => {
    try {
        console.log('Upload request received:', {
            filesCount: req.files ? req.files.length : 0,
            body: req.body,
            files: req.files ? req.files.map(f => ({ name: f.originalname, size: f.size })) : []
        });

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'No image files provided' 
            });
        }

        const imageUrls = await uploadMultipleToCloudinary(req.files);
        
        // Delete local files after upload
        req.files.forEach(file => {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        });

        res.status(200).json({ 
            success: true, 
            urls: imageUrls 
        });
    } catch (error) {
        console.error('Upload images error:', error);
        // Clean up local files if upload fails
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to upload images',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Upload document (for hotel license)
router.post('/document', isLoggedIn, handleUpload(upload.single('document')), async (req, res) => {
    try {
        console.log('Document upload request:', {
            hasFile: !!req.file,
            fileInfo: req.file ? { name: req.file.originalname, size: req.file.size, path: req.file.path } : null,
            user: req.user ? req.user.username : 'No user'
        });

        if (!req.file) {
            console.error('No file received in document request');
            return res.status(400).json({ 
                success: false,
                message: 'No document file provided' 
            });
        }

        console.log('Uploading document to Cloudinary:', req.file.originalname);
        const documentUrl = await uploadDocumentToCloudinary(req.file);
        console.log('Document uploaded successfully:', documentUrl);
        
        // Delete local file after upload
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(200).json({ 
            success: true, 
            url: documentUrl 
        });
    } catch (error) {
        console.error('Document upload error:', error);
        // Clean up local file if upload fails
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to upload document',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Test endpoint to check Cloudinary configuration
router.get('/test', isLoggedIn, (req, res) => {
    const cloudinary = require('../utils/cloudinary').cloudinary;
    const config = cloudinary.config();
    
    res.json({
        success: true,
        message: 'Upload route is working',
        cloudinaryConfigured: !!(config.cloud_name || process.env.CLOUDINARY_URL),
        user: req.user ? req.user.username : 'No user',
        hasCloudinaryUrl: !!process.env.CLOUDINARY_URL,
        hasIndividualCreds: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    });
});

module.exports = router;

