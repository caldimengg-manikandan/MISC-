const isProd = process.env.NODE_ENV === 'production';

// Detect if we are in a subfolder (like /misc)
const pathPrefix = window.location.pathname.startsWith('/misc') ? '/misc' : '';

let apiUrl = process.env.REACT_APP_API_URL || (isProd ? pathPrefix : 'http://localhost:5000');

if (apiUrl && apiUrl.includes('localhost') && window.location.hostname !== 'localhost') {
    apiUrl = apiUrl.replace('localhost', window.location.hostname);
}

export const API_BASE_URL = apiUrl;
export default API_BASE_URL;


