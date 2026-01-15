# 🎮 VRIVALS — The Ultimate Valorant Esports Ecosystem

![VRIVALS Banner](./public/banner.png)

**VRIVALS** is an award-winning, high-performance competitive platform engineered specifically for the _Valorant_ community. It bridges the gap between casual matchmaking and professional esports by offering a unified ecosystem for tournaments, player scouting, statistical analysis, and community building.

Built with an ultramodern tech stack featuring **Next.js 15**, **Tailwind CSS 4**, and **Appwrite**, VRIVALS delivers a pixel-perfect, responsive, and blazing-fast experience. It integrates directly with Riot Games' data (via HenrikDev API) to provide real-time stats, rank verification, and live match tracking.

---

## ✨ Comprehensive Feature Suite

### 🏆 Esports & Tournaments Engine

The core of VRIVALS is its professional-grade tournament management system.

- **Dynamic Bracket Generation**: Automated bracket creation for Single Elimination, Double Elimination, and Battle Royale formats.
- **Live Match Tracking**: Real-time updates for ongoing matches, including map picks/bans (simulated) and live score reporting.
- **Automated Kill/Death Tracking**: For Deathmatch tournaments, user stats are synced periodically to update standings automatically.
- **Prize Pool Management**: Integrated support for distributing prize pools (INR/USD), handling split payments, and managing payout status.
- **Match Rooms**: Dedicated lobbies for each match where teams can chat, ready up, and submit results (admin verified).

### 🔍 Player Finder & Intelligence (Scouting)

A sophisticated discovery engine to help teams find the perfect roster fit.

- **Smart Filtering**: Filter free agents by **Role** (Duelist, Controller, etc.), **Region** (AP, NA, EU), **Rank** (Radiant to Iron), and **Agent Pool**.
- **Intelligence Score (ELO)**: A proprietary algorithm that calculates a player's "Intelligence Score" based on their rank, win rate, and recent performance, displayed boldly on their card.
- **Detailed Agent Mastery**: Visual breakdown of a player's Main Agent and Secondary picks with mastery levels.
- **Direct Scouting**: "Scouting Report" feature allowing players to write a pitch about their playstyle and availability.

### 👤 Advanced Player Profiles

Your digital resume for the competitive scene.

- **Riot Account Sync**: One-click integration to fetch current Rank, Level, and Account Banner directly from Valorant.
- **Visual Career History**: A graphical timeline of your previous 10 matches with K/D/A ratios, Headshot percentages, and Win/Loss streaks.
- **Performance Metrics**: Detailed breakdown of stats including Average Combat Score (ACS), First Bloods, and Clutches.
- **Privacy Controls**: Options to toggle visibility of certain stats or contact information (Discord ID).

### 🏅 Hall of Fame (Leaderboards)

Compare yourself against the best on the platform.

- **Global Rankings**: Rank players by Total Earnings, Tournament Wins, or proprietary VRIVALS Score.
- **Top 3 Podium**: Premium, animated spotlight for the top 3 players of the season.
- **Regional Leaderboards**: Drill down to see who dominates your specific server region.

### 🛡️ Admin Command Center

A powerful dashboard for ecosystem managers.

- **User Management**: Search, ban, or verify users from a central table.
- **Tournament Control**: Create/Edit/Delete tournaments, force-advance brackets, and resolve match disputes.
- **Payment Verification**: Manual audit tools for verifying entry fee screenshots and transaction IDs.
- **System Health**: Monitor API usage and backend connection status.

---

## 🗺️ Sitemap & Page Overview

### PUBLIC ROUTES

- **`/` (Home)**: Award-winning landing page featuring 3D animations (GSAP), feature showcases, and call-to-action sections.
- **`/player-finder`**: The main hub for recruiting teammates. Features a grid of "Agent Cards" with live filters.
- **`/leaderboard`**: Global standings and top player showcases.
- **`/tournaments`**: List of upcoming, ongoing, and past tournaments with registration status.
- **`/about`**: Mission statement, team details, and platform roadmap.
- **`/contact`**: Support forms and social media links.
- **`/login` | `/register`**: Authentication portals with email/password and OAuth support.

### AUTHENTICATED ROUTES

- **`/profile`**: Your personal dashboard to manage your account, view stats, and edit your "Scouting Report".
- **`/player/[id]`**: Public view of a specific player's profile (viewable by anyone, but personalized context for logged-in users).
- **`/tournaments/[id]`**: Specific tournament lobby, brackets, and rules.

### LEGAL & SUPPORT

- `/privacy`, `/terms`, `/refund-policy`, `/rules`, `/support`.

---

## 🛠️ Technology Stack

| Layer           | Technology                                                               | Usage                                                   |
| :-------------- | :----------------------------------------------------------------------- | :------------------------------------------------------ |
| **Framework**   | **[Next.js 15](https://nextjs.org/)**                                    | App Router, Server Actions, SSR/ISR                     |
| **Language**    | **[React 19](https://react.dev/)**                                       | Component architecture, Hooks                           |
| **Styling**     | **[Tailwind CSS 4](https://tailwindcss.com/)**                           | Utility-first styling, Glassmorphism design system      |
| **Animations**  | **[GSAP](https://greensock.com/gsap/)**                                  | Advanced scroll triggers, text reveals, intro sequences |
| **Icons**       | **[Lucide React](https://lucide.dev/)**                                  | Consistent, lightweight SVG iconography                 |
| **Backend**     | **[Appwrite](https://appwrite.io/)**                                     | Authentication, Database, Storage, Cloud Functions      |
| **Game Data**   | **[HenrikDev API](https://github.com/Henrik-3/unofficial-valorant-api)** | Unofficial Valorant API for ranks/matches               |
| **Performance** | **[Vercel Speed Insights](https://vercel.com/docs/speed-insights)**      | Real-time user experience monitoring                    |

---

## 📁 Project Structure

```bash
src/
├── app/                  # Next.js 15 App Router
│   ├── (admin)/          # Protected Admin routes (Dashboard, User Mgmt)
│   ├── (main)/           # Public Layout & Pages
│   │   ├── player-finder/ # Player discovery module
│   │   ├── profile/      # User profile module
│   │   └── ...           # Other pages
│   ├── api/              # Internal API Routes (Proxies, Webhooks)
│   └── globals.css       # Tailwind 4 imports & global styles
├── components/           # Reusable UI Library
│   ├── admin/            # Admin-specific tables/forms
│   ├── landing/          # Hero, Features, special landing components
│   └── ...               # Generic UI (Buttons, Modals, Loaders)
├── context/              # React Context Providers (AuthContext)
├── lib/                  # Business Logic & Singletons
│   ├── appwrite.js       # Appwrite Client SDK configuration
│   ├── valorant.js       # Valorant API wrapper functions
│   └── utils.js          # Helper functions (CN, formatters)
└── assets/               # Static Assets (Images, Sounds, Fonts)
```

---

## 🚀 Installation & Setup

### 1. Prerequisites

- **Node.js** (v18.17.0 or better)
- **npm** (v9+) or **pnpm**
- An active **Appwrite** instance (Cloud or Self-Hosted)
- (Optional) **HenrikDev API Key** for production-level rate limits.

### 2. Clone the Repository

```bash
git clone https://github.com/aditya/valo-website.git
cd valo-website/frontend
```

### 3. Install Dependencies

```bash
npm install
# or
yarn install
```

### 4. Configure Environment Variables

Create a `.env.local` file in the root of `frontend/`:

```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here
NEXT_PUBLIC_APPWRITE_BUCKET_ID=your_storage_bucket_id_here

# Valorant API (Optional but recommended)
NEXT_PUBLIC_VALORANT_API_KEY=your_henrik_api_key

# Admin Configuration (Optional)
NEXT_PUBLIC_ADMIN_EMAIL=admin@vrivals.com
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📦 Deployment

### Vercel (Recommended)

1. Push your code to GitHub.
2. Import the project into Vercel.
3. Vercel will auto-detect Next.js.
4. Add the **Environment Variables** from step 4 into Vercel's settings.
5. Click **Deploy**.

### Netlify

1. Drag and drop the folder or connect via Git.
2. Set build command: `npm run build`.
3. Set publish directory: `.next`.
4. Configure standard Next.js plugin in Netlify.

---

## 🤝 Contributing Guidelines

We welcome community contributions!

1. **Fork** the repository.
2. Create a **Feature Branch** (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a **Pull Request**.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 🙏 Acknowledgements

- **Riot Games**: For creating Valorant and their API policies.
- **HenrikDev**: For the incredible unofficial API that powers independent projects.
- **Appwrite Team**: For the backend-as-a-service that makes this possible.
- **Lucide**: For the beautiful open-source icons.

---

_Designed & Developed by **Aditya** & **Leonardoo210399**_
