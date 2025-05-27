# Deployment Guide

## Quick Start

Your SoftCRM is ready for deployment! Here are the essential steps:

### 1. Environment Variables

Set these required environment variables in your hosting platform:

```bash
# Database (required)
DATABASE_URL=postgresql://username:password@hostname:port/database

# PayPal (required for payments)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# Session Security (required)
SESSION_SECRET=your-random-secret-key

# Environment
NODE_ENV=production
```

### 2. Platform-Specific Deployment

#### Netlify
- Build command: `npm run build`
- Publish directory: `dist`
- Configuration file: `netlify.toml` (included)

#### Vercel
- Configuration file: `vercel.json` (included)
- Auto-detects build settings

#### Railway/Render
- Build command: `npm run build`
- Start command: `npm start`
- Port: Auto-detected from environment

### 3. Database Setup

Make sure your PostgreSQL database is accessible and the connection string is correct. The app will automatically create the required tables on first run.

### 4. File Uploads

The app supports photo uploads which are stored in the `/uploads` directory. Make sure your hosting platform supports file storage or configure cloud storage if needed.

## Build Commands

- **Development**: `npm run dev`
- **Production Build**: `npm run build`
- **Start Production**: `npm start`
- **Type Check**: `npm run check`

## Features Included

✅ Client management with photo uploads
✅ Dashboard with real-time job status counts
✅ Follow-up reminders and notifications
✅ PayPal subscription payments
✅ Mobile-responsive design
✅ Offline support with sync

Your CRM is production-ready!