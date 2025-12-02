import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Linkedin, Heart } from 'lucide-react'; // Make sure to npm install lucide-react

const Footer = () => {
    return (
        <footer className="bg-gray-800 dark:bg-gray-900 text-white dark:text-gray-300 pt-10 pb-4">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
                
                {/* Brand */}
                <div>
                    <h3 className="text-xl font-bold mb-4">TravelNest</h3>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">
                        Your premier destination for finding the perfect accommodation. Discover amazing places to stay around the world.
                    </p>
                    <div className="flex space-x-4 mt-4">
                        <Facebook className="w-5 h-5 cursor-pointer hover:text-primary" />
                        <Instagram className="w-5 h-5 cursor-pointer hover:text-primary" />
                        <Twitter className="w-5 h-5 cursor-pointer hover:text-primary" />
                        <Linkedin className="w-5 h-5 cursor-pointer hover:text-primary" />
                    </div>
                </div>

                {/* Quick Links */}
                <div>
                    <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                    <ul className="space-y-2 text-gray-400 dark:text-gray-500 text-sm">
                        <li><Link to="/listings" className="hover:text-white">All Hotels</Link></li>
                        <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                        <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                    </ul>
                </div>

                {/* Support */}
                <div>
                    <h4 className="text-lg font-semibold mb-4">Support</h4>
                    <ul className="space-y-2 text-gray-400 dark:text-gray-500 text-sm">
                        <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
                        <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
                        <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
                        <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                    </ul>
                </div>

                {/* Info */}
                <div>
                    <h4 className="text-lg font-semibold mb-4">Contact</h4>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">support@travelnest.com</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">+91 98765 43210</p>
                </div>
            </div>

            <div className="border-t border-gray-700 dark:border-gray-800 mt-8 pt-4 text-center">
                <p className="text-gray-500 dark:text-gray-500 text-sm flex justify-center items-center gap-1">
                    &copy; 2025 TravelNest Pvt. Ltd. | Crafted with <Heart className="w-4 h-4 text-red-500" /> for travelers.
                </p>
            </div>
        </footer>
    );
};

export default Footer;