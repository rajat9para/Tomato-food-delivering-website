import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const API_PORT = Number(process.env.PORT || 5000);
export const BASE_URL = `http://localhost:${API_PORT}/api`;
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tomato';
export const JWT_SECRET = process.env.JWT_SECRET || 'secret';
