import React from 'react';

const About = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">About TravelNest</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    Connecting travelers with their perfect home away from home.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
                <div>
                    <img 
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                        alt="Team working" 
                        className="rounded-2xl shadow-lg"
                    />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Mission</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        At TravelNest, we believe that travel is the only thing you buy that makes you richer. Our mission is to make travel accessible, comfortable, and unforgettable for everyone. We strive to connect property owners with travelers seeking unique and authentic experiences.
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                        Founded in 2024, we've grown from a small startup to a trusted platform for thousands of users. Whether you're looking for a cozy cottage in the hills or a luxurious apartment in the city, TravelNest has something for everyone.
                    </p>
                </div>
            </div>

            <div className="bg-primary/5 rounded-2xl p-8 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div>
                        <h3 className="text-4xl font-bold text-primary mb-2">10k+</h3>
                        <p className="text-gray-600 dark:text-gray-300">Active Listings</p>
                    </div>
                    <div>
                        <h3 className="text-4xl font-bold text-primary mb-2">50k+</h3>
                        <p className="text-gray-600 dark:text-gray-300">Happy Travelers</p>
                    </div>
                    <div>
                        <h3 className="text-4xl font-bold text-primary mb-2">100+</h3>
                        <p className="text-gray-600 dark:text-gray-300">Cities Covered</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
