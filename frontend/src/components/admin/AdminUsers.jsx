import React from 'react';
import { ShieldCheck, ShieldX, Trash2 } from 'lucide-react';
import { useAdminUsers } from '../../hooks/admin/useAdminUsers';

const AdminUsers = () => {
  const { users, updateMembership, removeUser } = useAdminUsers();

  const handleToggleMembership = (id, current) => {
    updateMembership(id, current);
  };

  const handleDeleteUser = (id) => {
    if (window.confirm('Delete this user and all their bookings?')) {
      removeUser(id);
    }
  };

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
          {users.length} users
        </span>
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
              <th className="px-4 py-2 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
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
                <td className="px-4 py-2 text-right">
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
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-8 text-center text-xs text-gray-500"
                >
                  No users yet.
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
