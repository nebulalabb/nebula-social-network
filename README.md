# 🏯 Anime & Manga Social Network

A specialized social platform for Anime/Manga fans built with Next.js, Node.js, and Turborepo.

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x
- Docker & Docker Compose (for database & search engine)

### Setup
1. Clone the repository
2. Copy `.env.example` to `.env` and fill in the values
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start development:
   ```bash
   make dev
   # or
   npm run dev
   ```

## 📦 Project Structure
- `apps/web`: Next.js frontend (App Router)
- `apps/server`: Node.js/Express backend
- `packages/database`: Prisma schema & migrations
- `packages/types`: Shared TypeScript types
- `packages/utils`: Shared utility functions

## 🛠 Tech Stack
- **Frontend**: Next.js, Tailwind CSS, shadcn/ui, Zustand, React Query
- **Backend**: Node.js, Express, Prisma, Socket.IO
- **Databases**: PostgreSQL, MongoDB, Redis, Elasticsearch
- **Tools**: Turborepo, Docker, GitHub Actions

## 📜 Roadmap
See [ROADMAP.md](../../docs/ROADMAP.md) for detailed development phases.
