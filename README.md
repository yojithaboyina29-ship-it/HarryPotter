# Hogwarts Owl Post & Sorting Portal 🏰

A magical web portal featuring an AI-powered Sorting Ceremony, personalized class schedules, Owl Post messaging, and House Forums — all built for the Crossover Hackathon.

## ✨ Features

- **🎩 Sorting Ceremony**: An adaptive AI-powered quiz where the Sorting Hat asks personalized questions and determines your Hogwarts house
- **📅 Personalized Schedule**: AI-generated weekly timetable based on your house and interests
- **🦉 Owl Post**: Send and receive letters with AI-powered "magical flair" rewriting
- **💬 House Forums**: Discussion boards for each house with upvotes and comments
- **🏆 House Cup Leaderboard**: Points system tracking house competition

## 🛠️ Tech Stack

| Technology | Purpose | License |
|-----------|---------|---------|
| React 18 + Vite + TypeScript | Frontend | MIT |
| Tailwind CSS 3 | Styling | MIT |
| Framer Motion | Animations | MIT |
| Express.js + TypeScript | Backend API | MIT |
| sql.js (SQLite) | Database | MIT |
| Ollama + Gemma 3 | Local AI/LLM | Apache 2.0 |
| bcryptjs + JWT | Authentication | MIT |
| Google Fonts (Cinzel, Inter) | Typography | OFL |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- (Optional) [Ollama](https://ollama.ai) for AI features

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd HarryPotter

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Running the App

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

The app will be available at `http://localhost:5173`.

### (Optional) AI Features with Ollama

```bash
# Install Ollama from https://ollama.ai
ollama pull gemma3:4b
ollama serve
```

The app works fully without Ollama — it falls back to template-based sorting questions and scoring.

## 📁 Project Structure

```
HarryPotter/
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page components
│   │   ├── context/      # Auth context
│   │   ├── services/     # API client
│   │   └── types/        # TypeScript types
│   └── ...
├── server/          # Express backend
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   ├── services/     # AI, points, profanity
│   │   ├── middleware/   # Auth middleware
│   │   └── db/           # Database schema & seeds
│   └── ...
└── docs/            # Documentation
```

## 🤖 AI Usage Documentation

See [docs/AI_USAGE.md](docs/AI_USAGE.md) for details on how AI is integrated.

## 📄 Licenses

See [docs/LICENSES.md](docs/LICENSES.md) for all external resource licenses.

## 👥 Team

Built for the **Crossover Hackathon** — Where fandom meets innovation.
