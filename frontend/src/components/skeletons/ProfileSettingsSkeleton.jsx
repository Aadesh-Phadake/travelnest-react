import React from 'react';
import { Skeleton } from './SkeletonBase';

export const ProfileSettingsSkeleton = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-16 h-16 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-36 rounded" />
                            <Skeleton className="h-4 w-48 rounded" />
                        </div>
                    </div>
                    <Skeleton className="h-9 w-24 rounded-lg" />
                </div>

                {/* Settings Form Skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 space-y-6">
                    <Skeleton className="h-6 w-44 rounded-md mb-4" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24 rounded" />
                            <Skeleton className="h-11 w-full rounded-lg" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24 rounded" />
                            <Skeleton className="h-11 w-full rounded-lg" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Skeleton className="h-4 w-28 rounded" />
                        <Skeleton className="h-11 w-full rounded-lg" />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Skeleton className="h-11 w-32 rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettingsSkeleton;
