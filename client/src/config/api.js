const isProd = process.env.NODE_ENV === 'production';
let apiUrl = process.env.REACT_APP_API_URL || (isProd ? '' : 'http://localhost:5000');

if (apiUrl.includes('localhost') && window.location.hostname !== 'localhost') {
    apiUrl = apiUrl.replace('localhost', window.location.hostname);
}
export const API_BASE_URL = apiUrl;
export default API_BASE_URL;

