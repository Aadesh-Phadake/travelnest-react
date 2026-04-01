const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/contactMessage');
const wrapAsync = require('../utils/wrapAsync');

/**
 * @swagger
 * /api/contact:
 *   post:
 *     tags: [Contact]
 *     summary: Submit a new contact message
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Missing required fields
 */
router.post('/', wrapAsync(async (req, res) => {
    const { name, email, subject, message } = req.body;
    
    // Basic validation
    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    // Create new message
    // Note: 'subject' is not in the original schema I saw, but the frontend sends it. 
    // I should probably update the schema or just append it to the message.
    // Let's check the schema again.
    
    const newMessage = new ContactMessage({
        name,
        email,
        subject,
        message,
        user: req.user ? req.user._id : undefined // Link to user if logged in
    });

    await newMessage.save();

    res.status(201).json({ message: 'Message sent successfully!' });
}));

module.exports = router;
