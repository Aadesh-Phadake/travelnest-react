import React from 'react';
import { useSelector } from 'react-redux';
import {
  MessageSquare,
  Mail,
  Calendar,
  User
} from 'lucide-react';
import { format } from 'date-fns';

const ContactMessages = () => {
  const { contactMessages } = useSelector((state) => state.admin);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600 dark:text-pink-400">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Contact Messages</h2>
          <p className="text-sm text-gray-500">Inquiries from users and visitors</p>
        </div>
        <span className="ml-auto bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-pink-900 dark:text-pink-300">
          {contactMessages.length} messages
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {contactMessages.length > 0 ? (
          contactMessages.map((msg) => (
            <div key={msg._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {msg.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{msg.name}</h3>
                    <a href={`mailto:${msg.email}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {msg.email}
                    </a>
                  </div>
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-1 bg-gray-50 dark:bg-gray-900/50 px-3 py-1 rounded-full self-start">
                  <Calendar className="w-3 h-3" />
                  {msg.createdAt ? format(new Date(msg.createdAt), 'PPP p') : 'Unknown Date'}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {msg.message}
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            No messages received yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactMessages;
