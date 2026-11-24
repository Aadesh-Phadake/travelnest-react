import React from 'react';

/**
 * Primitive Skeleton box with shimmer and dark mode support
 */
export const Skeleton = ({ className = '', rounded = 'rounded-lg', ...props }) => {
    return (
        <div
            className={`bg-gray-200 dark:bg-gray-700/80 animate-pulse shimmer ${rounded} ${className}`}
            {...props}
        />
    );
};

export default Skeleton;
