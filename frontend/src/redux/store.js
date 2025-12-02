import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './authSlice';
import adminReducer from './adminSlice';

// 1. Create a root reducer that combines all slices
const rootReducer = combineReducers({
    auth: authReducer,
    admin: adminReducer,
});

// 2. Configure persistence
const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['auth'], // We generally don't persist admin data to ensure freshness, or we could if we want
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