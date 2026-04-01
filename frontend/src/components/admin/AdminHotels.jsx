import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useAdminHotels } from '../../hooks/admin/useAdminHotels';
import api from '../../api/axios';

const AdminHotels = ({ userRole }) => {
  const { hotels, removeHotel } = useAdminHotels();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedHotelId, setExpandedHotelId] = useState(null);
  const [loadingHotelId, setLoadingHotelId] = useState(null);
  const [bookingHistoryByHotel, setBookingHistoryByHotel] = useState({});
  const [historyErrorByHotel, setHistoryErrorByHotel] = useState({});

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

  const handleHotelRowClick = async (hotelId) => {
    if (expandedHotelId === hotelId) {
      setExpandedHotelId(null);
      return;
    }

    setExpandedHotelId(hotelId);

    if (bookingHistoryByHotel[hotelId] || loadingHotelId === hotelId) {
      return;
    }

    try {
      setLoadingHotelId(hotelId);
      setHistoryErrorByHotel((prev) => ({ ...prev, [hotelId]: null }));

      const { data } = await api.get(`/api/admin/hotels/${hotelId}/bookings-room-types`);

      setBookingHistoryByHotel((prev) => ({
        ...prev,
        [hotelId]: data,
      }));
    } catch (error) {
      const message = error?.response?.data?.error || 'Failed to load room type booking history';
      setHistoryErrorByHotel((prev) => ({ ...prev, [hotelId]: message }));
    } finally {
      setLoadingHotelId(null);
    }
  };

  const detailColSpan = userRole !== 'admin' ? 8 : 7;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredHotels = hotels.filter((hotel) => {
    if (!normalizedSearchQuery) return true;

    const title = (hotel.title || '').toLowerCase();
    const location = (hotel.location || '').toLowerCase();
    const country = (hotel.country || '').toLowerCase();
    const ownerUsername = (hotel.owner?.username || '').toLowerCase();
    const ownerEmail = (hotel.owner?.email || '').toLowerCase();

    return (
      title.includes(normalizedSearchQuery)
      || location.includes(normalizedSearchQuery)
      || country.includes(normalizedSearchQuery)
      || ownerUsername.includes(normalizedSearchQuery)
      || ownerEmail.includes(normalizedSearchQuery)
    );
  });

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
          {filteredHotels.length} hotels
        </span>
      </div>
      <div className="mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search hotels by name, location, country, owner"
          className="w-full sm:w-96 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
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
              {userRole !== 'admin' && <th className="px-4 py-2 font-semibold text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredHotels.map((h) => (
              <React.Fragment key={h._id}>
                <tr
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/40 cursor-pointer"
                  onClick={() => handleHotelRowClick(h._id)}
                >
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
                  {userRole !== 'admin' && (
                    <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDeleteHotel(h._id)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium text-red-500 border border-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </td>
                  )}
                </tr>
                {expandedHotelId === h._id && (
                  <tr className="bg-gray-50/60 dark:bg-gray-900/30">
                    <td colSpan={detailColSpan} className="px-4 py-3">
                      {loadingHotelId === h._id && (
                        <p className="text-xs text-gray-500">Loading room type booking history...</p>
                      )}

                      {!loadingHotelId && historyErrorByHotel[h._id] && (
                        <p className="text-xs text-red-500">{historyErrorByHotel[h._id]}</p>
                      )}

                      {!loadingHotelId && !historyErrorByHotel[h._id] && (
                        <div className="space-y-3">
                          {bookingHistoryByHotel[h._id]?.roomTypeGroups?.length ? (
                            bookingHistoryByHotel[h._id].roomTypeGroups.map((group) => (
                              <div
                                key={group.roomType}
                                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
                              >
                                <div className="flex items-center justify-between gap-3 mb-2">
                                  <div>
                                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 capitalize">
                                      {group.roomType} room
                                    </p>
                                    <p className="text-[11px] text-gray-500">
                                      Available: {group.availableRooms || 0}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[11px] text-gray-500">{group.totalBookings || 0} bookings</p>
                                    <p className="text-[11px] font-medium text-gray-700 dark:text-gray-200">
                                      ₹{(group.totalSpent || 0).toLocaleString('en-IN')}
                                    </p>
                                  </div>
                                </div>

                                {group.bookings?.length ? (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full text-[11px]">
                                      <thead className="text-gray-500">
                                        <tr className="text-left border-b border-gray-100 dark:border-gray-700">
                                          <th className="py-1 pr-3 font-medium">User</th>
                                          <th className="py-1 pr-3 font-medium">Check-in</th>
                                          <th className="py-1 pr-3 font-medium">Check-out</th>
                                          <th className="py-1 pr-3 font-medium">Guests</th>
                                          <th className="py-1 pr-3 font-medium">Amount</th>
                                          <th className="py-1 pr-3 font-medium">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {group.bookings.map((booking) => (
                                          <tr key={booking.bookingId} className="border-b border-gray-50 dark:border-gray-800">
                                            <td className="py-1 pr-3 text-gray-700 dark:text-gray-200">
                                              <div className="flex flex-col">
                                                <span>{booking.username || '—'}</span>
                                                <span className="text-[10px] text-gray-500">{booking.email || '—'}</span>
                                              </div>
                                            </td>
                                            <td className="py-1 pr-3 text-gray-700 dark:text-gray-200">{booking.checkIn || '—'}</td>
                                            <td className="py-1 pr-3 text-gray-700 dark:text-gray-200">{booking.checkOut || '—'}</td>
                                            <td className="py-1 pr-3 text-gray-700 dark:text-gray-200">{booking.guests || 0}</td>
                                            <td className="py-1 pr-3 text-gray-700 dark:text-gray-200">₹{(booking.totalAmount || 0).toLocaleString('en-IN')}</td>
                                            <td className="py-1 pr-3 text-gray-700 dark:text-gray-200 capitalize">{booking.status || '—'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-gray-500">No bookings for this room type.</p>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-500">No room types found for this hotel.</p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filteredHotels.length === 0 && (
              <tr>
                <td
                  colSpan={detailColSpan}
                  className="px-4 py-8 text-center text-xs text-gray-500"
                >
                  {normalizedSearchQuery ? 'No hotels match this search.' : 'No hotels yet.'}
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
