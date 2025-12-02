import React, { useState } from 'react';
import { useAdminOwners } from '../../hooks/admin/useAdminOwners';
import {
  Search,
  Trash2,
  Briefcase,
  Mail
} from 'lucide-react';

const OwnersTable = () => {
  const { owners, removeOwner } = useAdminOwners();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter owners
  const filteredOwners = owners.filter(owner =>
    owner.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredOwners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOwners = filteredOwners.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" />
          Hotel Managers
          <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            {owners.length}
          </span>
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search managers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Owner</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Hotels</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Bookings</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Guest Revenue</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Service Fee</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">15% Owner Share</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Platform Revenue</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {currentOwners.length > 0 ? (
                currentOwners.map((owner) => (
                  <tr key={owner.ownerId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {owner.username}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {owner.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-200">
                      {owner.hotels || 0}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-200">
                      {owner.totalBookings || 0}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-200">
                      ₹{(owner.grossRevenue || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-200">
                      ₹{(owner.commission || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-200">
                      ₹{(owner.ownerCommission || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-200">
                      ₹{(owner.platformRevenue || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => removeOwner(owner.ownerId)}
                        className="p-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                        title="Delete Manager & Their Hotels"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No managers found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredOwners.length)} of {filteredOwners.length} managers
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnersTable;
