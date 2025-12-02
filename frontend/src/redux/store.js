import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, createTransform } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './authSlice';
import dashboardReducer from './dashboardSlice';

// 1. Create a root reducer that combines all slices
const rootReducer = combineReducers({
    auth: authReducer,
    dashboard: dashboardReducer,
});

// Persist only the stable parts of auth (avoid persisting loading/error)
const authTransform = createTransform(
    // Transform state on its way to being serialized and persisted.
    (inboundState, key) => {
        if (key === 'auth') {
            return { user: inboundState.user };
        }
        return inboundState;
    },
    // Transform state being rehydrated
    (outboundState, key) => {
        if (key === 'auth') {
            return { user: outboundState.user || null, loading: false, error: null };
        }
        return outboundState;
    },
        { whitelist: ['auth'] }
);

// Persist minimal dashboard cache (optional: properties and chats metadata)
const dashboardTransform = createTransform(
    (inboundState, key) => {
        if (key === 'dashboard') {
            return {
                properties: inboundState.properties,
                chats: inboundState.chats.map(c => ({ _id: c._id, lastMessage: c.lastMessage, lastMessageTime: c.lastMessageTime, traveler: c.traveler, listing: c.listing })),
            };
        }
        return inboundState;
    },
    (outboundState, key) => {
        if (key === 'dashboard') {
            return {
                properties: outboundState.properties || [],
                chats: outboundState.chats || [],
                bookings: [],
                unreadCount: 0,
                loading: false,
                error: null,
            };
        }
        return outboundState;
    },
    { whitelist: ['dashboard'] }
);

// 2. Configure persistence
const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['auth','dashboard'],
    transforms: [authTransform, dashboardTransform],
};

// 3. Create the persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 4. Configure the store
export const store = configureStore({
    reducer: persistedReducer, // Pass the root persisted reducer
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export const persistor = persistStore(store);