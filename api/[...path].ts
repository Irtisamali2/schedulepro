import { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import { createApp } from '../server/index';

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
    console.log(`[Vercel] ${req.method} ${req.url}`);
    
    // Set environment for Vercel
    process.env.DEPLOY_TARGET = 'vercel';
    process.env.NODE_ENV = 'production';
    
    const app = await getApp();
    const serverlessHandler = serverless(app);
    return await serverlessHandler(req, res);
  } catch (error) {
    console.error('Serverless handler error:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      path: req.url,
      method: req.method
    });
  }
}