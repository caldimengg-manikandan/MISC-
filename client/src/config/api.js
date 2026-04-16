const isProd = process.env.NODE_ENV === 'production';
let apiUrl = process.env.REACT_APP_API_URL || (isProd ? '/misc/api' : 'http://localhost:5001');

if (apiUrl.includes('localhost') && window.location.hostname !== 'localhost') {
    apiUrl = apiUrl.replace('localhost', window.location.hostname);
}
const API_BASE_URL = apiUrl;

export default API_BASE_URL;
