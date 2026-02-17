import React from 'react';
import { Trash2 } from 'lucide-react';
import { useAdminOwners } from '../../hooks/admin/useAdminOwners';

const AdminOwners = () => {
  const { owners, removeOwner } = useAdminOwners();

  const handleDeleteOwner = (id) => {
    if (window.confirm('Delete this owner and all their hotels/bookings?')) {
      removeOwner(id);
    }
  };

  return (
    <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Hotel Owners
          </h2>
          <p className="text-xs text-gray-500">
            Aggregated performance and contribution of each owner to platform revenue.
          </p>
        </div>
        <span className="text-[11px] text-gray-500">
          {owners.length} owners
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500">
            <tr className="text-left">
              <th className="px-4 py-2 font-semibold">Owner</th>
              <th className="px-4 py-2 font-semibold">Hotels</th>
              <th className="px-4 py-2 font-semibold">Bookings</th>
              <th className="px-4 py-2 font-semibold">Guest Revenue</th>
              <th className="px-4 py-2 font-semibold">Service Fee</th>
              <th className="px-4 py-2 font-semibold">15% Owner Share</th>
              <th className="px-4 py-2 font-semibold">Platform Revenue</th>
              <th className="px-4 py-2 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {owners.map((o) => (
              <tr key={o.ownerId} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                <td className="px-4 py-2">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {o.username}
                    </span>
                    <span className="text-[11px] text-gray-500">{o.email}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                  {o.hotels || 0}
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                  {o.totalBookings || 0}
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                  ₹{(o.grossRevenue || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                  ₹{(o.commission || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                  ₹{(o.ownerCommission || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                  ₹{(o.platformRevenue || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => handleDeleteOwner(o.ownerId)}
                    className="p-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
            {owners.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  className="px-4 py-8 text-center text-xs text-gray-500"
                >
                  No owners found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminOwners;
