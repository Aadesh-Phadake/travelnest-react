import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, createTransform } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './authSlice';
import usersReducer from './admin/usersSlice';
import hotelsReducer from './admin/hotelsSlice';
import ownersReducer from './admin/ownersSlice';
import approvalsReducer from './admin/approvalsSlice';
import messagesReducer from './admin/messagesSlice';
import dashboardReducer from './dashboardSlice';

/**
 * Redux Store Configuration with Persistence
 *
 * This file configures the Redux store for the TravelNest application with redux-persist
 * to maintain user authentication state and dashboard cache across browser sessions.
 * Only stable, non-sensitive data is persisted to avoid security issues and state conflicts.
 */

// 1. Create a root reducer that combines all slices
const rootReducer = combineReducers({
    auth: authReducer,           // User authentication state (login, user data)
    users: usersReducer,         // Admin user management state
    hotels: hotelsReducer,       // Admin hotel management state
    owners: ownersReducer,       // Admin owner statistics state
    approvals: approvalsReducer, // Admin pending approvals state
    messages: messagesReducer,   // Admin contact messages state
    dashboard: dashboardReducer, // Owner dashboard data (properties, chats, bookings)
});

/**
 * Transform function for auth state persistence
 * Only persists the user object, excludes loading/error states to prevent stale data
 * On rehydration, resets loading/error to clean state
 */
const authTransform = createTransform(
    // Transform state on its way to being serialized and persisted.
    (inboundState, key) => {
        if (key === 'auth') {
            return { user: inboundState.user }; // Only persist user data
        }
        return inboundState;
    },
    // Transform state being rehydrated from storage
    (outboundState, key) => {
        if (key === 'auth') {
            return {
                user: outboundState.user || null,  // Restore user or set to null
                loading: false,                     // Reset loading state
                error: null                         // Reset error state
            };
        }
        return outboundState;
    },
    { whitelist: ['auth'] } // Only apply this transform to auth slice
);

/**
 * Transform function for dashboard state persistence
 * Persists properties and minimal chat metadata to maintain dashboard cache
 * Excludes volatile data like bookings and unread counts that should refresh
 */
const dashboardTransform = createTransform(
    (inboundState, key) => {
        if (key === 'dashboard') {
            return {
                // Persist all properties (hotel listings)
                properties: inboundState.properties,
                // Persist minimal chat data to maintain conversation cache
                chats: inboundState.chats.map(c => ({
                    _id: c._id,
                    lastMessage: c.lastMessage,
                    lastMessageTime: c.lastMessageTime,
                    traveler: c.traveler,
                    listing: c.listing
                })),
            };
        }
        return inboundState;
    },
    // Transform state being rehydrated from storage
    (outboundState, key) => {
        if (key === 'dashboard') {
            return {
                properties: outboundState.properties || [], // Restore properties or empty array
                chats: outboundState.chats || [],           // Restore chats or empty array
                bookings: [],                               // Always start fresh for bookings
                unreadCount: 0,                             // Reset unread count
                loading: false,                             // Reset loading state
                error: null                                 // Reset error state
            };
        }
        return outboundState;
    },
    { whitelist: ['dashboard'] } // Only apply this transform to dashboard slice
);

// 2. Configure persistence settings
const persistConfig = {
    key: 'root',                    // Storage key for the persisted state
    storage,                        // Use localStorage (default redux-persist storage)
    whitelist: ['auth', 'dashboard'], // Only persist auth and dashboard slices
    transforms: [authTransform, dashboardTransform], // Apply custom transforms
};

// 3. Create the persisted reducer by wrapping the root reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 4. Configure the Redux store with the persisted reducer
export const store = configureStore({
    reducer: persistedReducer, // Use the persisted reducer instead of root reducer
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            // Disable serializable state check for redux-persist compatibility
            // redux-persist uses non-serializable values internally
            serializableCheck: false,
        }),
});

// 5. Create and export the persistor for store rehydration
// This manages the persistence lifecycle and rehydrates state on app startup
export const persistor = persistStore(store);
