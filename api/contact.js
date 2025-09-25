import { storage } from '../server/storage.js';
import { insertContactMessageSchema } from '../shared/schema.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const validatedData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(validatedData);
      return res.status(201).json(message);
    } catch (error) {
      console.error('Contact form error:', error);
      return res.status(400).json({ error: 'Invalid contact form data' });
    }
  }

  if (req.method === 'GET') {
    try {
      const messages = await storage.getContactMessages();
      return res.status(200).json(messages);
    } catch (error) {
      console.error('Error fetching contact messages:', error);
      return res.status(500).json({ error: 'Failed to fetch contact messages' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}