import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  BarChart3,
  Building2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useAdminOverview } from '../../hooks/admin/useAdminOverview';

const PeriodPills = ({ value, onChange }) => {
  const options = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
    { value: 'year', label: 'Yearly' },
  ];
  return (
    <div className="inline-flex rounded-full bg-gray-100 dark:bg-gray-800 p-1 text-xs">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 rounded-full font-medium transition text-xs ${
            value === opt.value
              ? 'bg-white dark:bg-gray-900 text-primary shadow-sm'
              : 'text-gray-600 dark:text-gray-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

const AdminOverview = ({ setTab }) => {
  const {
    users,
    hotels,
    owners,
    pendingManagers,
    pendingHotels,
    stats: { revenueSeries, bookingsSeries, topHotelsSeries, commissionSummary },
    loadRevenueChart,
    loadBookingsChart,
  } = useAdminOverview();

  const [revenuePeriod, setRevenuePeriod] = useState('month');
  const [bookingsPeriod, setBookingsPeriod] = useState('month');

  useEffect(() => {
    loadRevenueChart(revenuePeriod);
  }, [revenuePeriod, loadRevenueChart]);

  useEffect(() => {
    loadBookingsChart(bookingsPeriod);
  }, [bookingsPeriod, loadBookingsChart]);

  const totalHotels = hotels.length;
  const grossRevenue =
    commissionSummary.totalRevenue ??
    hotels.reduce((sum, h) => sum + (h.revenue || 0), 0);
  const totalBookings = hotels.reduce((sum, h) => sum + (h.bookingCount || 0), 0);
  const totalCommission = commissionSummary.totalCommission || 0;

  const ownerGrossRevenue = Math.max(0, grossRevenue - totalCommission);
  const ownerCommission = ownerGrossRevenue * 0.15;
  const platformRevenue = totalCommission + ownerCommission;

  const totalPending = pendingManagers.length + pendingHotels.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Platform Revenue */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                ₹{platformRevenue.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-500">
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              +15% <span className="text-gray-400">service fee</span>
            </span>
          </div>
        </div>

        {/* Gross Booking Value */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Gross Bookings</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                ₹{grossRevenue.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Total value of all bookings
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Bookings</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {totalBookings.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600 dark:text-violet-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Across {totalHotels} listed hotels
          </div>
        </div>

        {/* Pending Actions */}
        <div 
          onClick={() => setTab('approvals')}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between cursor-pointer hover:border-primary/50 transition-colors group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Actions</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {totalPending}
              </h3>
            </div>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400 group-hover:bg-amber-200 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-amber-600 font-medium">
            {pendingManagers.length} managers, {pendingHotels.length} hotels
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Revenue Chart (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Revenue Analytics</h2>
                <p className="text-sm text-gray-500">Platform earnings vs Total transaction volume</p>
              </div>
              <PeriodPills value={revenuePeriod} onChange={setRevenuePeriod} />
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={revenueSeries.map((p) => {
                    const ownerGross = Math.max(0, (p.revenue || 0) - (p.commission || 0));
                    const ownerCommission = ownerGross * 0.15;
                    const platformRevenuePeriod = (p.commission || 0) + ownerCommission;
                    return {
                      ...p,
                      platformRevenue: platformRevenuePeriod,
                    };
                  })}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value, name) => [
                      `₹${value.toLocaleString('en-IN')}`,
                      name === 'platformRevenue' ? 'Net Revenue' : 'Gross Volume',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="revenue"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="platformRevenue"
                    name="platformRevenue"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Booking Trends</h2>
                <p className="text-sm text-gray-500">Number of reservations over time</p>
              </div>
              <PeriodPills value={bookingsPeriod} onChange={setBookingsPeriod} />
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingsSeries} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="bookings" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Right Column: Top Hotels & Quick Actions (1/3 width) */}
        <div className="space-y-6">
          {/* Top Performing Hotels */}
          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm h-full">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Top Performers</h2>
            <div className="space-y-6">
              {topHotelsSeries.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No data available yet.</p>
              )}
              {topHotelsSeries.map((h, i) => (
                <div key={h.name} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700' : 
                    i === 1 ? 'bg-gray-100 text-gray-700' : 
                    i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-600'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {h.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {h.bookings} bookings
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      ₹{(h.revenue || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setTab('hotels')}
              className="w-full mt-6 py-2 text-sm text-primary font-medium hover:bg-primary/5 rounded-lg transition-colors"
            >
              View all hotels
            </button>
          </section>

          {/* Quick Stats / Distribution */}
          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">User Distribution</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Travellers
                </span>
                <span className="font-semibold">{users.filter(u => u.role !== 'manager' && u.role !== 'admin').length}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${(users.filter(u => u.role !== 'manager').length / (users.length || 1)) * 100}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-sm pt-2">
                <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Managers
                </span>
                <span className="font-semibold">{owners.length}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ width: `${(owners.length / (users.length || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
