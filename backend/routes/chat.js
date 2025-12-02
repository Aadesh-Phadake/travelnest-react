const express = require('express');
const router = express.Router();
const Chat = require('../models/chat');
const Booking = require('../models/booking');
const Listing = require('../models/listing');
const { isLoggedIn } = require('../middleware');
const wrapAsync = require('../utils/wrapAsync');

// Get or create chat for a booking (Traveler)
router.get('/booking/:bookingId', isLoggedIn, wrapAsync(async (req, res) => {
    const { bookingId } = req.params;
    
    // Find the booking
    const booking = await Booking.findById(bookingId).populate('listing');
    if (!booking) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    
    // Verify user is the traveler for this booking
    if (booking.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    // Find existing chat or create new one
    let chat = await Chat.findOne({ booking: bookingId })
        .populate('traveler', 'username email')
        .populate('manager', 'username email')
        .populate('listing', 'title images')
        .populate('messages.sender', 'username');
    
    if (!chat) {
        // Get the listing to find the manager
        const listing = await Listing.findById(booking.listing._id || booking.listing);
        
        chat = new Chat({
            booking: bookingId,
            listing: listing._id,
            traveler: req.user._id,
            manager: listing.owner,
            messages: []
        });
        await chat.save();
        
        // Populate after save
        chat = await Chat.findById(chat._id)
            .populate('traveler', 'username email')
            .populate('manager', 'username email')
            .populate('listing', 'title images')
            .populate('messages.sender', 'username');
    }
    
    // Mark messages as read by traveler
    if (chat.unreadByTraveler > 0) {
        chat.messages.forEach(msg => {
            if (msg.senderRole === 'manager') {
                msg.isRead = true;
            }
        });
        chat.unreadByTraveler = 0;
        await chat.save();
    }
    
    res.json({ success: true, chat });
}));

// Send message (Traveler)
router.post('/booking/:bookingId/message', isLoggedIn, wrapAsync(async (req, res) => {
    const { bookingId } = req.params;
    const { message } = req.body;
    
    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, error: 'Message is required' });
    }
    
    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    
    // Verify user is the traveler
    if (booking.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    // Find or create chat
    let chat = await Chat.findOne({ booking: bookingId });
    
    if (!chat) {
        const listing = await Listing.findById(booking.listing);
        chat = new Chat({
            booking: bookingId,
            listing: listing._id,
            traveler: req.user._id,
            manager: listing.owner,
            messages: []
        });
    }
    
    // Add message
    chat.messages.push({
        sender: req.user._id,
        senderRole: 'traveler',
        message: message.trim()
    });
    
    chat.lastMessage = message.trim().substring(0, 100);
    chat.lastMessageTime = new Date();
    chat.unreadByManager += 1;
    
    await chat.save();
    
    // Return the new message
    const newMessage = chat.messages[chat.messages.length - 1];
    
    res.json({ 
        success: true, 
        message: {
            _id: newMessage._id,
            sender: { _id: req.user._id, username: req.user.username },
            senderRole: 'traveler',
            message: newMessage.message,
            timestamp: newMessage.timestamp
        }
    });
}));

// Get all chats for manager
router.get('/manager/all', isLoggedIn, wrapAsync(async (req, res) => {
    // Get all listings owned by this manager
    const managerListings = await Listing.find({ owner: req.user._id }, '_id');
    const listingIds = managerListings.map(l => l._id);
    
    // Find all chats for these listings
    const chats = await Chat.find({ listing: { $in: listingIds } })
        .populate('traveler', 'username email')
        .populate('listing', 'title images location')
        .populate('booking', 'checkIn checkOut')
        .sort('-lastMessageTime');
    
    res.json({ success: true, chats });
}));

// Get single chat for manager
router.get('/manager/:chatId', isLoggedIn, wrapAsync(async (req, res) => {
    const { chatId } = req.params;
    
    const chat = await Chat.findById(chatId)
        .populate('traveler', 'username email')
        .populate('manager', 'username email')
        .populate('listing', 'title images location')
        .populate('booking', 'checkIn checkOut totalAmount')
        .populate('messages.sender', 'username');
    
    if (!chat) {
        return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    
    // Verify user is the manager
    if (chat.manager._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    // Mark messages as read by manager
    if (chat.unreadByManager > 0) {
        chat.messages.forEach(msg => {
            if (msg.senderRole === 'traveler') {
                msg.isRead = true;
            }
        });
        chat.unreadByManager = 0;
        await chat.save();
    }
    
    res.json({ success: true, chat });
}));

// Send message (Manager)
router.post('/manager/:chatId/message', isLoggedIn, wrapAsync(async (req, res) => {
    const { chatId } = req.params;
    const { message } = req.body;
    
    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, error: 'Message is required' });
    }
    
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
        return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    
    // Verify user is the manager
    if (chat.manager.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    // Add message
    chat.messages.push({
        sender: req.user._id,
        senderRole: 'manager',
        message: message.trim()
    });
    
    chat.lastMessage = message.trim().substring(0, 100);
    chat.lastMessageTime = new Date();
    chat.unreadByTraveler += 1;
    
    await chat.save();
    
    // Return the new message
    const newMessage = chat.messages[chat.messages.length - 1];
    
    res.json({ 
        success: true, 
        message: {
            _id: newMessage._id,
            sender: { _id: req.user._id, username: req.user.username },
            senderRole: 'manager',
            message: newMessage.message,
            timestamp: newMessage.timestamp
        }
    });
}));

// Get unread count for manager (for badge)
router.get('/manager/unread/count', isLoggedIn, wrapAsync(async (req, res) => {
    const managerListings = await Listing.find({ owner: req.user._id }, '_id');
    const listingIds = managerListings.map(l => l._id);
    
    const chats = await Chat.find({ 
        listing: { $in: listingIds },
        unreadByManager: { $gt: 0 }
    });
    
    const totalUnread = chats.reduce((sum, chat) => sum + chat.unreadByManager, 0);
    
    res.json({ success: true, unreadCount: totalUnread });
}));

module.exports = router;
