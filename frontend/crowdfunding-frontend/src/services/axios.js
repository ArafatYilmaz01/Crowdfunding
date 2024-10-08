import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3000', // Backend API URL'si
  timeout: 10000,
});

export default instance;
