# CipherChat

CipherChat is a real-time messaging application built with Modern Web Technologies. It features end-to-end encryption aesthetics, instantaneous messaging, user presence (online/offline status), typing indicators, and a beautiful UI inspired by WhatsApp.

## Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database & Sync**: [Convex](https://www.convex.dev/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Styling**: Tailwind CSS & Shadcn UI

## Getting Started

First, install the dependencies:
```bash
npm install
```

Configure your environment variables by copying `env.example` to `.env.local` and filling in your Convex and Clerk keys:
```bash
cp env.example .env.local
```

Next, run the development servers. You need to run both the Next.js frontend and the Convex backend sync:

```bash
# Terminal 1: Run Next.js
npm run dev

# Terminal 2: Run Convex
npx convex dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
