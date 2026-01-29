# Job Auto Sender - AI Email Automation

## Tech Stack
- **Backend**: FastAPI + Python 3.11+
- **Frontend**: Next.js 14 + TypeScript + Tailwind
- **DB**: SQLite (dev) / PostgreSQL (prod)
- **AI**: Groq API (llama-3.3-70b)
- **HTTP Client**: httpx (async)
- **RSS Parsing**: BeautifulSoup4
- **Email**: SendGrid
- **Auth**: JWT + bcrypt

## Project Structure
```
job-auto-sender/
├── backend/app/
│   ├── api/v1/        # auth, users, jobs, emails
│   ├── core/          # config, security
│   ├── models/        # User, Job, Email
│   ├── services/      # ai_service, email_service
│   └── scrapers/      # free_job_apis.py (8 sources)
└── frontend/src/
    ├── app/           # pages (dashboard, jobs, emails, profile)
    ├── components/    # ui, layout
    ├── lib/           # api, utils
    └── store/         # auth store (zustand)
```

## Core Features

### 1. Job Aggregation (8 Free Sources - No API Keys Required)
- **Remotive** - Remote jobs from remotive.com
- **RemoteOK** - Remote jobs from remoteok.com
- **WeWorkRemotely** - WWR RSS feed
- **Arbeitnow** - European jobs
- **Jobicy** - Remote jobs worldwide
- **Himalayas** - Remote company jobs
- **NoDesk** - Remote work RSS feed
- **FindWork** - Developer jobs

### 2. Job Search with Filters
- **Time-Based**: Last 24h, 48h, Week, Month, All
- **Work Mode**: Remote, On-site, Hybrid
- **Employment Type**: Full-time, Part-time, Contract, Freelance, Internship
- **Experience Level**: Entry, Mid, Senior, Lead, Executive
- **Client-side filtering** for instant results

### 3. AI Email Generation
- Resume + Job based generation
- Custom context support
- Match score calculation
- Groq API (llama-3.3-70b)

### 4. Email System
- Single/Batch send with delays
- Scheduling support
- Status tracking (draft, sent, failed)

### 5. User Authentication
- JWT-based authentication
- bcrypt password hashing
- User profile management

## Key API Endpoints
```
# Jobs
GET  /api/v1/jobs/search/free      # Search free sources
GET  /api/v1/jobs/sources/free     # List available sources
POST /api/v1/jobs/                  # Create job
GET  /api/v1/jobs/                  # List user jobs
GET  /api/v1/jobs/stats             # Job statistics

# Emails
POST /api/v1/emails/generate/*     # Email generation
POST /api/v1/emails/batch-send     # Batch with delay
GET  /api/v1/emails/               # List emails
GET  /api/v1/emails/stats          # Email statistics

# Auth
POST /api/v1/auth/register         # Register user
POST /api/v1/auth/login            # Login
GET  /api/v1/auth/me               # Current user
```

## Free Job Sources
| Source | Type | URL |
|--------|------|-----|
| Remotive | JSON API | remotive.com |
| RemoteOK | JSON API | remoteok.com |
| WeWorkRemotely | RSS Feed | weworkremotely.com |
| Arbeitnow | JSON API | arbeitnow.com |
| Jobicy | JSON API | jobicy.com |
| Himalayas | JSON API | himalayas.app |
| NoDesk | RSS Feed | nodesk.co |
| FindWork | JSON API | findwork.dev |

## Run Commands
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## Environment Variables
```bash
# Backend (.env)
DATABASE_URL=sqlite+aiosqlite:///./job_sender.db
SECRET_KEY=your-secret-key
GROQ_API_KEY=your-groq-api-key
SENDGRID_API_KEY=your-sendgrid-key

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## UI Features
- Modern dashboard with job/email statistics
- Job cards with match scores and external links
- Clickable jobs redirect to original source URL
- Color-coded source badges
- Responsive sidebar navigation
- User profile with avatar
