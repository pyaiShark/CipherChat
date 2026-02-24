# CipherChat 🔒💬

CipherChat is a production-ready, real-time messaging application inspired by the premium aesthetics and functionality of WhatsApp. It is built on a modern serverless edge architecture, designed for instantaneous messaging, robust security, and seamless user experiences across devices.

---

## 🚀 Key Features

*   **Real-Time Messaging**: Built on WebSockets via Convex for zero-latency message delivery and synchronization across all clients.
*   **Message Delivery System**: WhatsApp-style message tracking (Single Gray Tick = Sent, Double Gray Tick = Delivered, Double Blue Tick = Read/Viewed).
*   **Voice Notes**: Native Web Audio API integration for real-time microphone recording and direct-to-cloud secure audio uploads.
*   **Group Chats**: Dynamic multi-user group sessions with dedicated admin controls (removing users, updating Group DPs).
*   **Rich Profile Viewing**: A cinematic global Profile Picture (DP) viewer designed for a premium UX.
*   **Live Presence Engine**: Highly accurate Online/Offline tracking combined with live "typing..." bouncing indicators that shut off intelligently.
*   **Emoji Reactions & Direct Emojis**: React to any message with inline emojis, and send giant standalone emojis when sent without text.
*   **Authentication & Security**: Powered by Clerk's Edge Middleware guarding against unauthenticated access, complete with a frictionless onboarding flow.
*   **Complete Data Ownership**: Users can permanently delete their account at any time. All associated data is immediately wiped and is unrecoverable by anyone.
*   **Sleek Dual-Theme UI**: Meticulously designed using Tailwind CSS and CSS Variables providing an absolute zero-flash dark and light mode toggle.

---

## 🛠 Tech Stack

Our application is built using the finest modern web tools available:
*   **Frontend Framework**: [Next.js 14](https://nextjs.org/) (App Router, Client Components)
*   **Reactive Backend**: [Convex](https://www.convex.dev/) (Serverless TypeScript Functions & Real-Time Sync)
*   **Identity Provider**: [Clerk](https://clerk.com/) (JWT Auth & User Profiles)
*   **Styling Engine**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)

---
## 🏁 Installation & Local Setup Guide

Follow these steps precisely to get the application running on your local machine.

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   **Node.js**: `v18.x` or higher
*   **npm** or **yarn**

### 2. Clone the Repository
```bash
git clone https://github.com/pyaishark/CipherChat.git
cd CipherChat
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Authentication (Clerk)
CipherChat relies on Clerk for user management.
1.  Go to [Clerk.com](https://clerk.com/) and sign up for a free account.
2.  Create a new Application.
3.  In your Clerk Dashboard, navigate to **API Keys**.
4.  Copy your `Publishable Key` and `Secret Key`.

### 5. Setup Database (Convex)
1. Go to [Convex.dev](https://www.convex.dev/) and sign up.
2. We need to initialize the Convex project locally, which will automatically handle giving you a deployment URL:
```bash
npx convex dev
```
*(This command will prompt you to log into Convex through your browser and will automatically provision a new cloud database for you)*

### 6. Configure Environment Variables
1.  In the root of the project, rename `env.example` to `.env.local` (or create a new `.env.local` file).
2.  Fill in the keys you generated in the steps above:

```ini
# Clerk Auth Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY=sk_test_YOUR_CLERK_SECRET_KEY

# Convex Production DB (Generated automatically by `npx convex dev`)
CONVEX_DEPLOYMENT=dev:your-convex-deployment-hash
NEXT_PUBLIC_CONVEX_URL=https://your-convex-project-hash.convex.cloud
```

### 7. Run the Application
The application requires running two separate servers simultaneously: The React frontend and the Convex backend listener.

**Terminal 1 (Convex Sync):**
```bash
npx convex dev
```
*Keep this running. It syncs your local `convex/` folder with the live cloud database.*

**Terminal 2 (Next.js Frontend):**
```bash
npm run dev
```

The application is now live at [http://localhost:3000](http://localhost:3000)! 

---

## 💡 Troubleshooting
*   **WebSocket/Subscription errors**: Ensure `npx convex dev` is running concurrently with your Next.js server. If Convex is closed, the UI will not load data.
*   **Redirect Loops upon Login**: Verify your `.env.local` Clerk keys precisely match the environment (Development vs Production) in your Clerk Dashboard.
