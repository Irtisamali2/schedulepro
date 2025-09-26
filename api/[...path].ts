import { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import { createApp } from '../server/index.js';

// Cache the app instance for better performance
let cachedApp: any = null;

async function getApp() {
  if (!cachedApp) {
    const { app } = await createApp();
    cachedApp = app;
  }
  return cachedApp;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();
    const serverlessHandler = serverless(app);
    return await serverlessHandler(req, res);
  } catch (error) {
    console.error('Serverless handler error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}