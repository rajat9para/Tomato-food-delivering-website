import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root (works in both dev and production)
// In production on Render, env vars are set via dashboard, so this is a fallback
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const API_PORT = Number(process.env.PORT || 5000);
export const BASE_URL = process.env.NODE_ENV === 'production'
    ? '/api'
    : `http://localhost:${API_PORT}/api`;
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tomato';
export const JWT_SECRET = process.env.JWT_SECRET || 'secret_tomato_key_2026';
