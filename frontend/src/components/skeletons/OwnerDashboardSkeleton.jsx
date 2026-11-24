import React from 'react';
import { Skeleton } from './SkeletonBase';

export const OwnerDashboardSkeleton = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-24 rounded-lg" />
                    <Skeleton className="h-8 w-48 rounded-lg" />
                    <Skeleton className="h-9 w-44 rounded-lg" />
                </div>

                {/* Profile Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <Skeleton className="w-24 h-24 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-3 w-full text-center md:text-left">
                            <Skeleton className="h-7 w-48 rounded-lg mx-auto md:mx-0" />
                            <Skeleton className="h-4 w-60 rounded mx-auto md:mx-0" />
                            <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3">
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-6 w-28 rounded-full" />
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mt-8 gap-6 pb-2">
                        <Skeleton className="h-8 w-32 rounded-lg" />
                        <Skeleton className="h-8 w-36 rounded-lg" />
                        <Skeleton className="h-8 w-28 rounded-lg" />
                        <Skeleton className="h-8 w-28 rounded-lg" />
                    </div>

                    {/* Table Skeleton */}
                    <div className="mt-6 overflow-x-auto">
                        <div className="space-y-4">
                            {/* Table Header */}
                            <div className="grid grid-cols-6 gap-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                                <Skeleton className="h-4 w-20 rounded" />
                                <Skeleton className="h-4 w-16 rounded" />
                                <Skeleton className="h-4 w-24 rounded" />
                                <Skeleton className="h-4 w-16 rounded" />
                                <Skeleton className="h-4 w-16 rounded" />
                                <Skeleton className="h-4 w-16 rounded" />
                            </div>

                            {/* Table Rows */}
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="grid grid-cols-6 gap-4 py-3 items-center border-b border-gray-100 dark:border-gray-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                                        <Skeleton className="h-4 w-28 rounded" />
                                    </div>
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                    <Skeleton className="h-4 w-32 rounded" />
                                    <Skeleton className="h-4 w-16 rounded" />
                                    <Skeleton className="h-4 w-12 rounded" />
                                    <Skeleton className="h-4 w-20 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboardSkeleton;
