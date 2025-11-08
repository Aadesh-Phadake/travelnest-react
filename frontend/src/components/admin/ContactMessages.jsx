import React from 'react';
import { useAdminMessages } from '../../hooks/admin/useAdminMessages';
import {
  MessageSquare,
  Mail,
  Calendar,
  User
} from 'lucide-react';
import { format } from 'date-fns';

/**
 * ContactMessages Component
 *
 * Admin dashboard component for displaying and managing user contact messages.
 * Shows all messages submitted through the contact form with user details,
 * timestamps, and message content. Provides a clean, responsive interface
 * for administrators to review user inquiries and feedback.
 *
 * Features:
 * - Real-time message count display
 * - User avatar generation from name initials
 * - Clickable email links for direct contact
 * - Formatted timestamps using date-fns
 * - Responsive design with mobile-first approach
 * - Dark mode support
 * - Empty state handling
 */
const ContactMessages = () => {
  // Fetch contact messages using the admin messages hook
  // This provides loading states, error handling, and automatic data fetching
  const { messages: contactMessages } = useAdminMessages();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section with Title and Message Count */}
      <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Icon with themed background */}
        <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600 dark:text-pink-400">
          <MessageSquare className="w-5 h-5" />
        </div>

        {/* Title and description */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Contact Messages</h2>
          <p className="text-sm text-gray-500">Inquiries from users and visitors</p>
        </div>

        {/* Message count badge */}
        <span className="ml-auto bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-pink-900 dark:text-pink-300">
          {contactMessages.length} messages
        </span>
      </div>

      {/* Messages Grid Container */}
      <div className="grid grid-cols-1 gap-4">
        {contactMessages.length > 0 ? (
          // Render each contact message
          contactMessages.map((msg) => (
            <div key={msg._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              {/* Message Header: User Info and Timestamp */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                {/* User Information Section */}
                <div className="flex items-center gap-3">
                  {/* Generated Avatar: First letter of name as fallback */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {msg.name.charAt(0).toUpperCase()}
                  </div>

                  {/* User Details */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{msg.name}</h3>
                    {/* Clickable email link for direct contact */}
                    <a href={`mailto:${msg.email}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {msg.email}
                    </a>
                  </div>
                </div>

                {/* Timestamp Display */}
                <div className="text-sm text-gray-500 flex items-center gap-1 bg-gray-50 dark:bg-gray-900/50 px-3 py-1 rounded-full self-start">
                  <Calendar className="w-3 h-3" />
                  {/* Format date with fallback for missing timestamps */}
                  {msg.createdAt ? format(new Date(msg.createdAt), 'PPP p') : 'Unknown Date'}
                </div>
              </div>

              {/* Message Content */}
              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {msg.message}
              </div>
            </div>
          ))
        ) : (
          /* Empty State: Displayed when no messages exist */
          <div className="py-12 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            No messages received yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactMessages;
