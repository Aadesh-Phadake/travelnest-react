import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './authSlice';

// 1. Create a root reducer that combines all slices
const rootReducer = combineReducers({
    auth: authReducer,
});

// 2. Configure persistence
const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['auth'], // Now this works because 'auth' exists in rootReducer
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