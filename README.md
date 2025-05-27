# SoftCRM - Mobile-First CRM for Solo Contractors

A minimal, mobile-first CRM platform designed specifically for solo contractors to track clients, job notes, and manage follow-ups.

## Features

- **Client Management**: Add, edit, and track clients with contact information and job status
- **Photo Upload**: Attach photos to client notes and job updates
- **Follow-up Reminders**: Schedule and track follow-ups with clients
- **Job Status Tracking**: Track jobs from lead to completion (Lead → Quoted → Scheduled → Completed → Paid)
- **Dashboard**: Real-time overview of job statuses and today's follow-ups
- **Mobile-First Design**: Responsive design optimized for mobile devices
- **Offline Support**: Works offline with background sync
- **PayPal Integration**: Secure payment processing for subscriptions

## Pricing

- **Free Plan**: Up to 5 clients with core features
- **Unlimited Plan**: $15/month for unlimited clients and premium features

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (Supabase)
- **Payment**: PayPal Server SDK
- **UI Components**: Radix UI, shadcn/ui

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd softcrm
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `PAYPAL_CLIENT_ID` - PayPal client ID
- `PAYPAL_CLIENT_SECRET` - PayPal client secret
- `SESSION_SECRET` - Session encryption secret

4. Run the development server:
```bash
npm run dev
```

## Deployment

The application is configured for deployment on platforms like Netlify, Vercel, or Railway.

### Build Commands

- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Start**: `npm start`

### Environment Setup

Make sure to set all required environment variables in your hosting platform.

## License

MIT License