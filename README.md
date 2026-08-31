# Auto Job Finder

> Pulls fresh roles from 8 remote-job sources, scores them against your resume, and writes the application email for you.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_Llama_3.3-F55036?style=flat-square&logo=groq&logoColor=white)

Job hunting is mostly repetitive work: open eight job boards, filter the same way on each,
then rewrite the same email with a different company name. This app does that loop —
aggregating listings, ranking them by how well they match your resume, and generating a
tailored email per role that you can review and batch-send.

Every job source used here is **free and needs no API key**.

---

## Features

**Aggregation across 8 sources**

| Source | Type | Source | Type |
| :--- | :--- | :--- | :--- |
| Remotive | JSON API | Jobicy | JSON API |
| RemoteOK | JSON API | Himalayas | JSON API |
| WeWorkRemotely | RSS | NoDesk | RSS |
| Arbeitnow | JSON API | FindWork | JSON API |

**Filtering** — by posting age (24h / 48h / week / month), work mode (remote, on-site, hybrid),
employment type (full-time, part-time, contract, freelance, internship) and experience level
(entry → executive). Filtering happens client-side, so results are instant.

**AI email generation** — Groq `llama-3.3-70b` reads the job description alongside your resume,
produces a match score, and drafts an email you can steer with extra context.

**Sending** — single or batch send through SendGrid, with configurable delays between messages,
scheduling, and per-email status tracking (draft / sent / failed).

**Accounts** — JWT auth with bcrypt hashing and editable profiles.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | FastAPI · Python 3.11+ · httpx (async) |
| **Frontend** | Next.js 14 · TypeScript · Tailwind CSS · Zustand |
| **Database** | SQLite (dev) → PostgreSQL (prod) |
| **AI** | Groq API — `llama-3.3-70b` |
| **Email** | SendGrid |
| **Scraping** | BeautifulSoup4 |

---

## Getting Started

**Backend**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

### Environment

`backend/.env`

```bash
DATABASE_URL=sqlite+aiosqlite:///./job_sender.db
SECRET_KEY=your-secret-key
GROQ_API_KEY=your-groq-api-key
SENDGRID_API_KEY=your-sendgrid-key
```

`frontend/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## API

```
GET   /api/v1/jobs/search/free      Search all free sources
GET   /api/v1/jobs/sources/free     List available sources
GET   /api/v1/jobs/stats            Job statistics

POST  /api/v1/emails/generate       Generate a tailored email
POST  /api/v1/emails/batch-send     Batch send with delay
GET   /api/v1/emails/stats          Email statistics

POST  /api/v1/auth/register         Register
POST  /api/v1/auth/login            Login
GET   /api/v1/auth/me               Current user
```

Interactive docs at `http://localhost:8000/docs`.

---

## Project Structure

```
auto-job-finder/
├── backend/app/
│   ├── api/v1/      # auth, users, jobs, emails
│   ├── services/    # ai_service, email_service
│   ├── scrapers/    # free_job_apis.py — all 8 sources
│   └── models/      # User, Job, Email
└── frontend/src/
    ├── app/         # dashboard, jobs, emails, profile
    ├── components/  # ui, layout
    └── store/       # zustand auth store
```
