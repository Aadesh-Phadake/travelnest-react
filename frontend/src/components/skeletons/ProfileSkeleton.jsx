import React from 'react';
import { Skeleton } from './SkeletonBase';

export const ProfileSkeleton = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* 1. Profile Header Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
                    <Skeleton className="w-24 h-24 rounded-full flex-shrink-0" />

                    <div className="flex-1 w-full text-center md:text-left space-y-3">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                            <div className="space-y-1">
                                <Skeleton className="h-7 w-40 rounded-lg mx-auto md:mx-0" />
                                <Skeleton className="h-4 w-48 rounded mx-auto md:mx-0" />
                            </div>
                            <Skeleton className="h-9 w-28 rounded-lg" />
                        </div>

                        <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3">
                            <Skeleton className="h-6 w-28 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                    </div>
                </div>

                {/* 2. Tabs Navigation Skeleton */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 gap-6 pb-2">
                    <Skeleton className="h-8 w-36 rounded-lg" />
                    <Skeleton className="h-8 w-28 rounded-lg" />
                    <Skeleton className="h-8 w-40 rounded-lg" />
                </div>

                {/* 3. Bookings List Skeletons */}
                <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
                        >
                            <div className="flex flex-col md:flex-row">
                                {/* Image Placeholder */}
                                <div className="md:w-48 h-36 md:h-auto">
                                    <Skeleton className="w-full h-full rounded-none" />
                                </div>

                                {/* Details */}
                                <div className="flex-1 p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1.5 flex-1 pr-4">
                                            <Skeleton className="h-6 w-3/4 max-w-sm rounded" />
                                            <Skeleton className="h-4 w-1/3 rounded" />
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <Skeleton className="h-6 w-20 rounded ml-auto" />
                                            <Skeleton className="h-3 w-14 rounded ml-auto" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-7 w-48 rounded-lg" />
                                        <Skeleton className="h-7 w-24 rounded-lg" />
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <Skeleton className="h-4 w-24 rounded" />
                                        <div className="flex gap-2">
                                            <Skeleton className="h-8 w-24 rounded-lg" />
                                            <Skeleton className="h-8 w-20 rounded-lg" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProfileSkeleton;
