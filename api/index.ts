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

export default async function handler(req: any, res: any) {
  const app = await getApp();
  const serverlessHandler = serverless(app);
  return serverlessHandler(req, res);
}