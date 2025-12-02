import React from 'react';
import { Search, BookOpen, MessageCircle, Shield, CreditCard, Home } from 'lucide-react';

const HelpCenter = () => {
    const categories = [
        {
            icon: BookOpen,
            title: "Getting Started",
            description: "Learn how to create an account, book a stay, or list your property."
        },
        {
            icon: CreditCard,
            title: "Payments & Refunds",
            description: "Information about payment methods, pricing, and refund policies."
        },
        {
            icon: Home,
            title: "Hosting",
            description: "Everything you need to know about hosting on TravelNest."
        },
        {
            icon: Shield,
            title: "Safety & Security",
            description: "Guidelines for a safe and secure experience for all users."
        },
        {
            icon: MessageCircle,
            title: "Communication",
            description: "How to communicate with hosts and guests effectively."
        }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">How can we help?</h1>
                <div className="max-w-2xl mx-auto relative">
                    <input
                        type="text"
                        placeholder="Search for help articles..."
                        className="w-full p-4 pl-12 rounded-full border border-gray-300 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {categories.map((category, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition cursor-pointer">
                        <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center text-primary mb-4">
                            <category.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{category.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">{category.description}</p>
                    </div>
                ))}
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Still need help?</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Our support team is available 24/7 to assist you.</p>
                <a href="/contact" className="inline-block bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition">
                    Contact Support
                </a>
            </div>
        </div>
    );
};

export default HelpCenter;
