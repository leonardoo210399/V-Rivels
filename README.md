# 🎮 VRIVALS — The Ultimate Valorant Tournament Platform

![Banner](https://images.unsplash.com/photo-1624138784614-87fd1b6528f2?q=80&w=2000&auto=format&fit=crop)

**VRIVALS** is a premium, high-performance web platform designed for Valorant players to compete, track their progress, and find teammates. Built with a modern tech stack (Next.js 15 + Appwrite), it offers a seamless experience from registration to final victory.

---

## ✨ Key Features

### 🏆 Advanced Tournament System

- **Dynamic Brackets**: Supports Single Elimination and Battle Royale/Deathmatch formats.
- **Real-time Standings**: Live tracking of kills, deaths, and scores during Deathmatch tournaments.
- **Match Management**: Admins can control match states (Ongoing/Completed) and verify final results.
- **Prize Distribution**: Native support for First Prize, Runner Up, and customized "Additional Prizes" (e.g., MVP, Best Play) in ₹ (INR).

### � Player Identity & Stats Sync

- **Riot Integration**: Direct syncing with the official Valorant API (via HenrikDev) to fetch player cards, ranks, and levels.
- **Personalized Profiles**: Detailed player portfolios including:
  - **Match History**: Recent 10 matches with K/D/A and performance analysis.
  - **Peak Rank**: Showcasing highest achieved tiers.
  - **Platform Statistics**: Total earnings, tournaments won, and match win rates.

### 🔍 Team Finder (Scouting Reports)

- **Free Agent Listings**: Players can create "Scouting Reports" to find teams.
- **Role-Based Discovery**: Filter players by role (Duelist, Controller, Sentinel, Initiator).
- **Agent Depth**: Display main and secondary agent preferences with high-fidelity Valorant agent icons.

### 🏅 Hall of Fame (Leaderboard)

- **Top Performers**: Global leaderboard ranking players by total platform earnings and tournament wins.
- **Podium View**: Premium visual treatment for the top 3 legends of the platform.
- **Region Filtering**: Easily identify top talent across various regions.

### 🛡️ Admin Power Panel

- **User Management**: Search and manage hundreds of registered users with ease.
- **Tournament Control**: Create, edit, and delete tournaments with detailed metadata management.
- **Payment Verification**: Manual verification system for tournament entry fees.

---

## 🛠️ Technology Stack

| Layer            | Technology                                                                      |
| :--------------- | :------------------------------------------------------------------------------ |
| **Frontend**     | [Next.js 15](https://nextjs.org/) (App Router), React 19                        |
| **Styling**      | [Tailwind CSS 4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) |
| **Animations**   | [GSAP](https://greensock.com/gsap/) & Framer Motion                             |
| **Backend**      | [Appwrite](https://appwrite.io/) (Auth, Database, Storage)                      |
| **External API** | [HenrikDev Valorant API](https://github.com/Henrik-3/unofficial-valorant-api)   |

---

## 📁 Project Structure

```text
src/
├── app/               # Next.js App Router (Main & Admin groups)
│   ├── (admin)/       # Protected Admin Dashboard routes
│   └── (main)/        # Public-facing routes (Profile, Leaderboard, etc.)
├── components/        # Reusable UI components (Brackets, Standings, Modals)
├── context/           # React Context (Auth State management)
├── lib/               # Utility functions (Appwrite, Valorant API wrappers)
└── assets/            # Static icons, rank images, and agent assets
```

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js (v18 or higher)
- An [Appwrite](https://appwrite.io/) Cloud account or self-hosted instance.
- A [HenrikDev API Key](https://v3.riotapi.net/docs/) (Optional but recommended for high traffic).

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/aditya/valo-website.git

# Enter the directory
cd valo-website/frontend

# Install dependencies
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory and add your credentials:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=valo-website-database
NEXT_PUBLIC_VALORANT_API_KEY=your_henrikdev_api_key
```

### 4. Run Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## � Security & Performance

- **Optimized Asset Loading**: Foreground and background pre-loading for rank/agent icons.
- **Protected Routes**: Middleware and React Context verify admin/user sessions before access.
- **Secret Scan Proof**: Configured to ensure no sensitive Appwrite keys leak during client-side builds.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

_Created with ❤️ for the Valorant community by [Leonardoo210399](https://github.com/leonardoo210399)_
