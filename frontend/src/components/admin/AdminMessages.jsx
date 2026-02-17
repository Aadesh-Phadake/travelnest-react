import React from 'react';
import { useAdminMessages } from '../../hooks/admin/useAdminMessages';

const AdminMessages = () => {
  const { contactMessages } = useAdminMessages();

  return (
    <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Contact Messages
          </h2>
          <p className="text-xs text-gray-500">
            Messages sent via the Contact Us page.
          </p>
        </div>
        <span className="text-[11px] text-gray-500">
          {contactMessages.length} messages
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500">
            <tr className="text-left">
              <th className="px-4 py-2 font-semibold">Name</th>
              <th className="px-4 py-2 font-semibold">Email</th>
              <th className="px-4 py-2 font-semibold">Subject</th>
              <th className="px-4 py-2 font-semibold">Message</th>
              <th className="px-4 py-2 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {contactMessages.map((msg) => (
              <tr key={msg._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">
                  {msg.name}
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                  {msg.email}
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                  {msg.subject || '—'}
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200 max-w-xs truncate" title={msg.message}>
                  {msg.message}
                </td>
                <td className="px-4 py-2 text-gray-500">
                  {msg.createdAt
                    ? new Date(msg.createdAt).toLocaleDateString('en-GB')
                    : '—'}
                </td>
              </tr>
            ))}
            {contactMessages.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-8 text-center text-xs text-gray-500"
                >
                  No messages yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminMessages;
