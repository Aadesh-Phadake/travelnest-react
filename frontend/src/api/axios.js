import axios from 'axios';

const api = axios.create({
    // 1. The Destination
    baseURL: 'http://localhost:8080', 
    // This saves you time. 
    // Instead of typing: axios.get('http://localhost:8080/listings')
    // You just type:     api.get('/listings')
    
    // 2. The ID Card (CRITICAL)
    withCredentials: true, 
    // This is the most important line. 
    // Your backend uses 'express-session' and Passport.js.
    // Sessions rely on a "cookie" being stored in the browser.
    // By default, React/Axios does NOT send this cookie to a different port (8080).
    // This line forces Axios to carry the Session Cookie with every request.
    // Without this, your user will be logged out immediately after logging in.

    // 3. The Language
    headers: {
        'Content-Type': 'application/json',
    }
    // This tells the backend: "I am sending you data in JSON format," 
    // so your 'app.use(express.json())' in the backend can understand it.
});

// Request interceptor to handle file uploads
api.interceptors.request.use((config) => {
    // If data is FormData, remove Content-Type header to let browser set it
    if (config.data instanceof FormData) {
        // Remove Content-Type from all possible locations
        if (config.headers) {
            delete config.headers['Content-Type'];
            delete config.headers.common?.['Content-Type'];
            delete config.headers.post?.['Content-Type'];
        }
        // Ensure axios doesn't set it automatically
        config.headers = config.headers || {};
    }
    return config;
});

export default api;