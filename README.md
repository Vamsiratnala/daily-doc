# DailyDoc

Patients describe their problem in plain words and book a nearby clinic doctor. Doctors with small clinics register, set their hours and manage bookings. Results are ranked by **problem match (50%)**, **ratings (30%)** and **distance (20%)**.

**Stack:** Next.js 15 (App Router, TypeScript) · Tailwind CSS v4 · Motion + GSAP · Prisma (SQLite locally, Postgres in production) · JWT cookie auth · pluggable chatbot (Ollama or any OpenAI-compatible server) with RAG · WhatsApp Cloud API.

## Run it locally

```bash
npm install
cp .env.example .env      # then set AUTH_SECRET to a long random string
npm run db:setup          # creates the SQLite DB and seeds 60 demo doctors
npm run dev               # http://localhost:3000
```

Demo logins (password `password123`): `patient@dailydoc.in`, `doctor@dailydoc.in`.

## What's where

| Path | What it does |
| --- | --- |
| `src/app/page.tsx` | Landing page (symptom search, specialities, GSAP stats band) |
| `src/app/search/page.tsx` | Ranked results with score breakdown, sort and distance filters |
| `src/app/doctors/[id]` | Doctor profile, hours, reviews, slot booking |
| `src/app/dashboard` | Patient: upcoming/past visits, cancel, rate completed visits |
| `src/app/doctor/register`, `src/app/doctor/dashboard` | Clinic sign-up; appointments, hours, profile, reviews |
| `src/app/actions/*` | Server actions for auth, booking and doctor management |
| `src/lib/ranking.ts` | Scoring: problem match + Bayesian rating + distance decay |
| `src/lib/specialties.ts` | Symptom → speciality lexicon (includes some Hinglish terms) |
| `src/lib/slots.ts` | Slot generation in IST, double-booking guard |
| `src/lib/llm.ts`, `src/lib/rag.ts`, `src/lib/assistant.ts` | Chatbot provider, retrieval, answer logic |
| `src/content/faqs.ts` | Knowledge base the chatbot answers from. Edit freely |
| `src/lib/whatsapp.ts`, `src/app/api/whatsapp/webhook` | Outbound notifications and inbound WhatsApp chat |
| `prisma/schema.prisma`, `prisma/seed.ts` | Data model and demo data |

## Chatbot (model not fixed yet)

The assistant is model-agnostic. With no model configured it still works: it retrieves the best FAQ (BM25) and suggests matching doctors from the database. To plug in a model, set:

```env
LLM_BASE_URL="http://your-server:11434"   # Ollama, or a llama.cpp / vLLM / hosted OpenAI-compatible URL
LLM_MODEL="<model name>"
LLM_API_STYLE="ollama"                     # or "openai" for /v1/chat/completions servers
LLM_API_KEY=""                              # if the server needs one
EMBED_MODEL=""                              # optional: use embeddings instead of BM25 for retrieval
```

The model only answers from retrieved context (FAQs, specialities and live doctor data), never diagnoses, and emergencies are short-circuited to "call 108 / 112".

## WhatsApp

Without credentials, every message is written to the `NotificationLog` table and the server log instead of being sent, so bookings never fail. To go live with the WhatsApp Cloud API set `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`. Outside the 24-hour service window Meta requires an approved template: set `WHATSAPP_TEMPLATE` (one body variable) and `WHATSAPP_TEMPLATE_LANG`.

For two-way chat, point the Meta webhook to `https://<your-domain>/api/whatsapp/webhook` with verify token `WHATSAPP_VERIFY_TOKEN`; incoming messages are answered by the same assistant. An Indian BSP (Gupshup, Interakt, etc.) can be swapped in by editing `sendWhatsApp` in `src/lib/whatsapp.ts`.

Notifications sent: booking received (patient + doctor), confirmed, cancelled (either side), and a rating request after a visit is marked done.

## Deploy to Vercel

SQLite does not persist on Vercel, so use Postgres (Neon or Supabase):

1. In `prisma/schema.prisma` change `provider = "sqlite"` to `provider = "postgresql"`.
2. In Vercel set `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, and any LLM / WhatsApp variables.
3. Run `npx prisma db push` (and `npm run seed` if you want demo data) against that database once.
4. Deploy. `postinstall` runs `prisma generate` automatically.
