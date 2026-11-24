import React from 'react';
import { Skeleton } from './SkeletonBase';

export const AdminDashboardSkeleton = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
            {/* Admin Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-56 rounded-lg" />
                    <Skeleton className="h-4 w-72 rounded" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-24 rounded-lg" />
                    <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-3 overflow-x-auto pb-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-10 w-28 rounded-lg flex-shrink-0" />
                ))}
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3 shadow-sm"
                    >
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-24 rounded" />
                            <Skeleton className="w-8 h-8 rounded-lg" />
                        </div>
                        <Skeleton className="h-8 w-28 rounded-md" />
                        <Skeleton className="h-3 w-36 rounded" />
                    </div>
                ))}
            </div>

            {/* Analytics Area Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-36 rounded" />
                        <Skeleton className="h-8 w-28 rounded-lg" />
                    </div>
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
                    <Skeleton className="h-6 w-36 rounded" />
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-28 rounded" />
                                    <Skeleton className="h-3 w-16 rounded" />
                                </div>
                                <Skeleton className="h-4 w-16 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardSkeleton;
