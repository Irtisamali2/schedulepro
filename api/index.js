import express from 'express';
import { registerRoutes } from '../server/routes.js';

// Create Express app for Vercel
const app = express();

// Register all routes
await registerRoutes(app);

export default app;