import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useAdminOwners } from '../../hooks/admin/useAdminOwners';
import api from '../../api/axios';

const AdminOwners = ({ userRole }) => {
  const { owners, removeOwner } = useAdminOwners();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOwnerId, setExpandedOwnerId] = useState(null);
  const [loadingOwnerId, setLoadingOwnerId] = useState(null);
  const [bookingHistoryByOwner, setBookingHistoryByOwner] = useState({});
  const [historyErrorByOwner, setHistoryErrorByOwner] = useState({});

  const handleDeleteOwner = (id) => {
    if (window.confirm('Delete this owner and all their hotels/bookings?')) {
      removeOwner(id);
    }
  };

  const handleOwnerRowClick = async (ownerId) => {
    if (expandedOwnerId === ownerId) {
      setExpandedOwnerId(null);
      return;
    }

    setExpandedOwnerId(ownerId);

    if (bookingHistoryByOwner[ownerId] || loadingOwnerId === ownerId) {
      return;
    }

    try {
      setLoadingOwnerId(ownerId);
      setHistoryErrorByOwner((prev) => ({ ...prev, [ownerId]: null }));

      const { data } = await api.get(`/api/admin/owners/${ownerId}/bookings`);

      setBookingHistoryByOwner((prev) => ({
        ...prev,
        [ownerId]: data,
      }));
    } catch (error) {
      const message = error?.response?.data?.error || 'Failed to load owner booking history';
      setHistoryErrorByOwner((prev) => ({ ...prev, [ownerId]: message }));
    } finally {
      setLoadingOwnerId(null);
    }
  };

  const detailColSpan = userRole !== 'admin' ? 8 : 7;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredOwners = owners
    .filter((owner) => {
      if (!normalizedSearchQuery) return true;

      const username = (owner.username || '').toLowerCase();
      const email = (owner.email || '').toLowerCase();
      return username.includes(normalizedSearchQuery) || email.includes(normalizedSearchQuery);
    })
    .sort((a, b) => {
      if ((b.totalBookings || 0) !== (a.totalBookings || 0)) {
        return (b.totalBookings || 0) - (a.totalBookings || 0);
      }
      if ((b.platformRevenue || 0) !== (a.platformRevenue || 0)) {
        return (b.platformRevenue || 0) - (a.platformRevenue || 0);
      }
      return (a.username || '').localeCompare(b.username || '');
    });

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
          {filteredOwners.length} owners
        </span>
      </div>
      <div className="mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search owners by name or email"
          className="w-full sm:w-80 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
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
              {userRole !== 'admin' && <th className="px-4 py-2 font-semibold text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredOwners.map((o) => (
              <React.Fragment key={o.ownerId}>
                <tr
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/40 cursor-pointer"
                  onClick={() => handleOwnerRowClick(o.ownerId)}
                >
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
                  {userRole !== 'admin' && (
                    <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDeleteOwner(o.ownerId)}
                        className="p-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  )}
                </tr>
                {expandedOwnerId === o.ownerId && (
                  <tr className="bg-gray-50/60 dark:bg-gray-900/30">
                    <td colSpan={detailColSpan} className="px-4 py-3">
                      {loadingOwnerId === o.ownerId && (
                        <p className="text-xs text-gray-500">Loading owner booking history...</p>
                      )}

                      {!loadingOwnerId && historyErrorByOwner[o.ownerId] && (
                        <p className="text-xs text-red-500">{historyErrorByOwner[o.ownerId]}</p>
                      )}

                      {!loadingOwnerId && !historyErrorByOwner[o.ownerId] && (
                        <div className="space-y-3">
                          {bookingHistoryByOwner[o.ownerId]?.hotels?.length ? (
                            bookingHistoryByOwner[o.ownerId].hotels.map((hotel) => (
                              <div
                                key={hotel.hotelId}
                                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
                              >
                                <div className="flex items-center justify-between gap-3 mb-2">
                                  <div>
                                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                      {hotel.hotelName}
                                    </p>
                                    <p className="text-[11px] text-gray-500">
                                      {[hotel.location, hotel.country].filter(Boolean).join(', ') || '—'}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[11px] text-gray-500">{hotel.totalBookings || 0} bookings</p>
                                    <p className="text-[11px] font-medium text-gray-700 dark:text-gray-200">
                                      ₹{(hotel.totalSpent || 0).toLocaleString('en-IN')}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  {hotel.roomTypeGroups?.map((group) => (
                                    <div
                                      key={group.roomType}
                                      className="rounded-md border border-gray-100 dark:border-gray-700 p-2"
                                    >
                                      <div className="flex items-center justify-between gap-3 mb-2">
                                        <div>
                                          <p className="text-[11px] font-semibold text-gray-900 dark:text-gray-100 capitalize">
                                            {group.roomType} room
                                          </p>
                                          <p className="text-[10px] text-gray-500">
                                            Available: {group.availableRooms || 0}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[10px] text-gray-500">{group.totalBookings || 0} bookings</p>
                                          <p className="text-[10px] text-gray-700 dark:text-gray-200">
                                            ₹{(group.totalSpent || 0).toLocaleString('en-IN')}
                                          </p>
                                        </div>
                                      </div>

                                      {group.bookings?.length ? (
                                        <div className="overflow-x-auto">
                                          <table className="min-w-full text-[10px]">
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
                                        <p className="text-[10px] text-gray-500">No bookings for this room type.</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-500">No hotels found for this owner.</p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filteredOwners.length === 0 && (
              <tr>
                <td
                  colSpan={detailColSpan}
                  className="px-4 py-8 text-center text-xs text-gray-500"
                >
                  {normalizedSearchQuery ? 'No owners match this search.' : 'No owners found.'}
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
