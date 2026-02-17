import React from 'react';
import { Trash2 } from 'lucide-react';
import { useAdminHotels } from '../../hooks/admin/useAdminHotels';

const AdminHotels = () => {
  const { hotels, removeHotel } = useAdminHotels();

  const handleDeleteHotel = (id) => {
    if (window.confirm('Delete this hotel permanently?')) {
      removeHotel(id);
    }
  };

  const formatDateDisplay = (raw) => {
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-GB');
  };

  return (
    <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Hotels
          </h2>
          <p className="text-xs text-gray-500">
            Global view of all listings created on the platform.
          </p>
        </div>
        <span className="text-[11px] text-gray-500">
          {hotels.length} hotels
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500">
            <tr className="text-left">
              <th className="px-4 py-2 font-semibold">Hotel</th>
              <th className="px-4 py-2 font-semibold">Location</th>
              <th className="px-4 py-2 font-semibold">Owner</th>
              <th className="px-4 py-2 font-semibold">Bookings</th>
              <th className="px-4 py-2 font-semibold">Revenue</th>
              <th className="px-4 py-2 font-semibold">Platform Revenue</th>
              <th className="px-4 py-2 font-semibold">Created</th>
              <th className="px-4 py-2 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {hotels.map((h) => (
              <tr key={h._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                <td className="px-4 py-2">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {h.title}
                    </span>
                    <span className="text-[11px] text-gray-500 truncate max-w-[220px]">
                      {h._id}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                  {h.location}, {h.country}
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                  {h.owner?.username || '—'}
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                  {h.bookingCount || 0}
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                  ₹{(h.revenue || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                  ₹{(h.platformRevenue || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-2 text-gray-500">
                  {formatDateDisplay(h.createdAt || h.lastUpdated) || '—'}
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => handleDeleteHotel(h._id)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium text-red-500 border border-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </td>
              </tr>
            ))}
            {hotels.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  className="px-4 py-8 text-center text-xs text-gray-500"
                >
                  No hotels yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminHotels;
