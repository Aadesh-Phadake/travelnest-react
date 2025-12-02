import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { deleteHotel } from '../../redux/adminSlice';
import {
  Search,
  Trash2,
  Building2,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const HotelsTable = () => {
  const dispatch = useDispatch();
  const { hotels } = useSelector((state) => state.admin);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter hotels
  const filteredHotels = hotels.filter(hotel =>
    hotel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentHotels = filteredHotels.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this hotel? This action cannot be undone.')) {
      dispatch(deleteHotel(id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          All Hotels
          <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            {hotels.length}
          </span>
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search hotels..."
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
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Hotel</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Location</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Owner</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Bookings</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Revenue</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Platform Revenue</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Created</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {currentHotels.length > 0 ? (
                currentHotels.map((hotel) => (
                  <tr key={hotel._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                          {hotel.title}
                        </span>
                        <span className="text-[11px] text-gray-500 truncate max-w-[150px]">
                          {hotel._id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {hotel.location}, {hotel.country}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-200">
                      {hotel.owner?.username || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-200">
                      {hotel.bookingCount || 0}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-200">
                      ₹{(hotel.revenue || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-200">
                      ₹{(hotel.platformRevenue || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {hotel.createdAt ? format(new Date(hotel.createdAt), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/listings/${hotel._id}`}
                          target="_blank"
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="View Listing"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(hotel._id)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium text-red-500 border border-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No hotels found matching "{searchTerm}"
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
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredHotels.length)} of {filteredHotels.length} hotels
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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

export default HotelsTable;
