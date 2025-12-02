import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQ = () => {
    const faqs = [
        {
            question: "How do I book a property?",
            answer: "Booking is easy! Simply browse our listings, select your dates, and click 'Book Now'. Follow the prompts to complete your payment and secure your reservation."
        },
        {
            question: "What is the cancellation policy?",
            answer: "Cancellation policies vary by property. You can find the specific policy for each listing on its details page. Generally, we offer free cancellation up to 48 hours before check-in."
        },
        {
            question: "How do I list my property?",
            answer: "To list your property, sign up as a 'Hotel Manager' and navigate to your dashboard. Click 'List your property' and fill in the details about your space."
        },
        {
            question: "Is my payment information secure?",
            answer: "Yes, we use industry-standard encryption and secure payment gateways to ensure your financial information is always protected."
        },
        {
            question: "Can I contact the host before booking?",
            answer: "Currently, direct messaging is available after a booking is confirmed. However, listing descriptions are detailed to answer most questions."
        },
        {
            question: "What if I have an issue during my stay?",
            answer: "If you encounter any issues, please contact the host first. If the issue is not resolved, our 24/7 support team is here to help."
        }
    ];

    const [openIndex, setOpenIndex] = useState(null);

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                    Find answers to common questions about TravelNest.
                </p>
            </div>

            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <div 
                        key={index} 
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                    >
                        <button
                            className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none"
                            onClick={() => toggleFAQ(index)}
                        >
                            <span className="font-semibold text-gray-900 dark:text-white">{faq.question}</span>
                            {openIndex === index ? (
                                <ChevronUp className="w-5 h-5 text-gray-500" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                        </button>
                        {openIndex === index && (
                            <div className="px-6 pb-4 text-gray-600 dark:text-gray-300 text-sm border-t border-gray-100 dark:border-gray-700 pt-4">
                                {faq.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FAQ;
