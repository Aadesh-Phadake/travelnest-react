import React, { useState } from 'react';
import { ShieldCheck, ShieldX, Trash2 } from 'lucide-react';
import { useAdminUsers } from '../../hooks/admin/useAdminUsers';
import api from '../../api/axios';

const AdminUsers = ({ userRole }) => {
  const { users, updateMembership, removeUser } = useAdminUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [loadingUserId, setLoadingUserId] = useState(null);
  const [bookingHistoryByUser, setBookingHistoryByUser] = useState({});
  const [historyErrorByUser, setHistoryErrorByUser] = useState({});

  const handleToggleMembership = (id, current) => {
    updateMembership(id, current);
  };

  const handleDeleteUser = (id) => {
    if (window.confirm('Delete this user and all their bookings?')) {
      removeUser(id);
    }
  };

  const handleUserRowClick = async (userId) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }

    setExpandedUserId(userId);

    if (bookingHistoryByUser[userId] || loadingUserId === userId) {
      return;
    }

    try {
      setLoadingUserId(userId);
      setHistoryErrorByUser((prev) => ({ ...prev, [userId]: null }));

      const { data } = await api.get(`/api/admin/users/${userId}/bookings`);

      setBookingHistoryByUser((prev) => ({
        ...prev,
        [userId]: data,
      }));
    } catch (error) {
      const message = error?.response?.data?.error || 'Failed to load booking history';
      setHistoryErrorByUser((prev) => ({ ...prev, [userId]: message }));
    } finally {
      setLoadingUserId(null);
    }
  };

  const detailColSpan = userRole !== 'admin' ? 6 : 5;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    if (!normalizedSearchQuery) return true;
    const username = (user.username || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    return username.includes(normalizedSearchQuery) || email.includes(normalizedSearchQuery);
  });

  return (
    <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Users
          </h2>
          <p className="text-xs text-gray-500">
            Manage travellers and memberships. TravelNest master is hidden.
          </p>
        </div>
        <span className="text-[11px] text-gray-500">
          {filteredUsers.length} users
        </span>
      </div>
      <div className="mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search users by name or email"
          className="w-full sm:w-80 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500">
            <tr className="text-left">
              <th className="px-4 py-2 font-semibold">User</th>
              <th className="px-4 py-2 font-semibold">Bookings</th>
              <th className="px-4 py-2 font-semibold">Total spent</th>
              <th className="px-4 py-2 font-semibold">Last booking</th>
              <th className="px-4 py-2 font-semibold">Member</th>
              {userRole !== 'admin' && <th className="px-4 py-2 font-semibold text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredUsers.map((u) => (
              <React.Fragment key={u._id}>
                <tr
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/40 cursor-pointer"
                  onClick={() => handleUserRowClick(u._id)}
                >
                  <td className="px-4 py-2">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {u.username}
                    </span>
                    <span className="text-[11px] text-gray-500">{u.email}</span>
                  </div>
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                    {u.totalBookings || 0}
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                    ₹{(u.totalSpent || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {u.lastBooking
                      ? new Date(u.lastBooking).toLocaleDateString('en-GB')
                      : '—'}
                  </td>
                  <td className="px-4 py-2">
                    {u.isMember ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                        <ShieldX className="w-3 h-3" /> None
                      </span>
                    )}
                  </td>
                  {userRole !== 'admin' && (
                    <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleToggleMembership(u._id, u.isMember)}
                          className="px-3 py-1 rounded-full text-[11px] font-medium border border-primary/30 text-primary hover:bg-primary/5 transition"
                        >
                          {u.isMember ? 'Remove' : 'Make member'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
                {expandedUserId === u._id && (
                  <tr className="bg-gray-50/60 dark:bg-gray-900/30">
                    <td colSpan={detailColSpan} className="px-4 py-3">
                      {loadingUserId === u._id && (
                        <p className="text-xs text-gray-500">Loading booking history...</p>
                      )}

                      {!loadingUserId && historyErrorByUser[u._id] && (
                        <p className="text-xs text-red-500">{historyErrorByUser[u._id]}</p>
                      )}

                      {!loadingUserId && !historyErrorByUser[u._id] && (
                        <div className="space-y-3">
                          {bookingHistoryByUser[u._id]?.hotels?.length ? (
                            bookingHistoryByUser[u._id].hotels.map((hotel) => (
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
                                    <p className="text-[11px] text-gray-500">{hotel.totalBookings} bookings</p>
                                    <p className="text-[11px] font-medium text-gray-700 dark:text-gray-200">
                                      ₹{(hotel.totalSpent || 0).toLocaleString('en-IN')}
                                    </p>
                                  </div>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-[11px]">
                                    <thead className="text-gray-500">
                                      <tr className="text-left border-b border-gray-100 dark:border-gray-700">
                                        <th className="py-1 pr-3 font-medium">Check-in</th>
                                        <th className="py-1 pr-3 font-medium">Check-out</th>
                                        <th className="py-1 pr-3 font-medium">Guests</th>
                                        <th className="py-1 pr-3 font-medium">Amount</th>
                                        <th className="py-1 pr-3 font-medium">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {hotel.bookings.map((booking) => (
                                        <tr key={booking.bookingId} className="border-b border-gray-50 dark:border-gray-800">
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
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-500">No bookings found for this traveller.</p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td
                  colSpan={detailColSpan}
                  className="px-4 py-8 text-center text-xs text-gray-500"
                >
                  {normalizedSearchQuery ? 'No users match this search.' : 'No users yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminUsers;
