import React from 'react';

const Privacy = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Privacy Policy</h1>
            
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                <p className="mb-4">Last updated: December 2025</p>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. Information We Collect</h2>
                <p className="mb-4">
                    We collect information you provide directly to us, such as when you create an account, make a booking, or contact us for support. This may include your name, email address, phone number, and payment information.
                </p>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. How We Use Your Information</h2>
                <p className="mb-4">
                    We use the information we collect to provide, maintain, and improve our services, to process your transactions, and to communicate with you.
                </p>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">3. Information Sharing</h2>
                <p className="mb-4">
                    We may share your information with hosts when you make a booking, or with third-party service providers who help us operate our business (e.g., payment processors).
                </p>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">4. Data Security</h2>
                <p className="mb-4">
                    We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.
                </p>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">5. Your Rights</h2>
                <p className="mb-4">
                    You have the right to access, correct, or delete your personal information. You can manage your account settings or contact us for assistance.
                </p>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">6. Cookies</h2>
                <p className="mb-4">
                    We use cookies and similar technologies to collect information about your browsing activities and to improve your experience on our website.
                </p>
            </div>
        </div>
    );
};

export default Privacy;
