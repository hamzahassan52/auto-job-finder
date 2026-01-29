# Job Auto Sender - AI Email Automation

## Tech Stack
- **Backend**: FastAPI + Python 3.11+
- **Frontend**: Next.js 14 + TypeScript + Tailwind
- **DB**: SQLite (dev) / PostgreSQL (prod)
- **AI**: Groq API (llama-3.3-70b)
- **Scraping**: Playwright + BeautifulSoup
- **Email**: SendGrid

## Project Structure
```
job-auto-sender/
├── backend/app/
│   ├── api/v1/        # auth, users, jobs, emails
│   ├── core/          # config, security
│   ├── models/        # User, Job, Email
│   ├── services/      # ai_service, email_service
│   └── scrapers/      # linkedin, indeed (advanced)
└── frontend/src/
    ├── app/           # pages
    ├── components/    # ui, layout
    └── lib/           # api, utils
```

## Core Features

### 1. Job Scraping
- LinkedIn & Indeed scrapers
- URL import (auto-detect source)
- **Advanced Search Filters:**
  - Country/City location
  - Work mode (Remote/On-site/Hybrid)
  - Job type (Full-time/Part-time/Contract)
  - Experience level (Entry/Mid/Senior)
  - Posted within (24h/48h/1week/1month)
  - Visa sponsorship filter

### 2. AI Email Generation
- Resume + Job based
- Custom context based
- Fully automated
- Match score calculation

### 3. Email System
- Single/Batch send with delays
- Scheduling
- 24/48h recent emails
- Status tracking

## Key API Endpoints
```
POST /api/v1/jobs/search/advanced   # Advanced search
POST /api/v1/jobs/import-url        # Import from URL
POST /api/v1/emails/generate/*      # Email generation
POST /api/v1/emails/batch-send      # Batch with delay
GET  /api/v1/emails/recent/24       # Recent emails
```

## Advanced Search Example
```json
{
  "keywords": "Software Engineer",
  "country": "Canada",
  "city": "Toronto",
  "work_mode": "remote",
  "posted_within": "24h",
  "visa_sponsorship": true,
  "sources": ["linkedin", "indeed"],
  "limit": 20
}
```

## Run
```bash
# Backend
cd backend && pip install -r requirements.txt
playwright install chromium
uvicorn app.main:app --reload

# Frontend
cd frontend && npm install && npm run dev
```
