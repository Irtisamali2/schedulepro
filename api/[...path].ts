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
    
    // Ensure we don't handle static file requests
    if (req.url && (req.url.includes('/assets/') || req.url.endsWith('.json') || req.url.endsWith('.svg') || req.url.endsWith('.png') || req.url.endsWith('.css') || req.url.endsWith('.js'))) {
      console.log(`[Vercel] Rejecting static file request: ${req.url}`);
      return res.status(404).json({ error: 'Static file should not reach API handler' });
    }
    
    const app = await getApp();
    const serverlessHandler = serverless(app, {
      binary: false,
      request: (request: any, event: any, context: any) => {
        // Ensure proper method handling
        request.method = req.method;
        request.url = req.url;
        request.headers = req.headers;
        request.body = req.body;
      }
    });
    
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