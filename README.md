# Smart Kigali Alert 🚨

A civic issue reporting and AI-verified resolution platform for Kigali, Rwanda.
Built live at the SMART-250 Lyftathon 2026 — City & Community track.

## The problem

Urban issues in Kigali — potholes, broken street lights, illegal dumping,
blocked drains — go unreported or unresolved with no accountability loop.

## The solution

Citizens photograph issues and submit in 30 seconds. Gemini AI analyzes
the photo, finds the responsible Rwandan institution via Google Search,
and sends them an alert email automatically.

Agents upload resolution proof. AI compares before and after photos to
verify the fix is genuine. The reporter is notified. Every Friday, an
automated reminder goes to institutions with unresolved issues.

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18 + TypeScript |
| UI        | Chakra UI v3 |
| Routing   | React Router v6 |
| AI        | Gemini 2.0 Flash (vision + Google Search grounding) |
| Email     | EmailJS |
| Storage   | localStorage |
| Build     | Vite |

## AI calls

| # | Trigger | What Gemini does |
|---|---------|-----------------|
| 1a | Photo upload | Vision analysis — type, title, severity |
| 1b | After 1a | Google Search grounding — finds real institution + email |
| 2 | On submit | Generates formal email body to institution |
| 3 | Agent resolves | Compares before/after photos, returns confidence score |
| 4 | Friday button | Generates accountability reminder for all open issues |

## Setup

1. Copy `.env.example` to `.env` and fill in your keys
   - `VITE_GEMINI_API_KEY` — from Google AI Studio (aistudio.google.com)
   - `VITE_EMAILJS_*` — from emailjs.com (free tier, connect your Gmail)
2. `npm install`
3. `npm run dev`

## Agent demo passcodes

| Institution | Passcode |
|-------------|----------|
| Rwanda Transport Development Agency | `rtda2026` |
| City of Kigali — Sanitation | `san2026` |
| Rwanda Energy Group (REG) | `reg2026` |
| WASAC | `wasac2026` |
| City of Kigali — Urban Planning | `urban2026` |

## Demo flow for judges

1. Open `/` — show two entrances
2. Go to `/report` — upload a photo of a pothole or waste pile
3. Watch AI analyze, search for institution, send email — show confirmation page
4. Go to `/dashboard` — show the live issue card
5. Go to `/agent` — log in as RTDA agent
6. Click Resolve — upload after photo — show AI confidence score
7. Click "Simulate Friday Reminder" — show email sent toast
8. Back to `/dashboard` — issue now shows as Resolved with AI confidence

## Team

Built live at SMART-250 Lyftathon 2026 · Kigali, Rwanda
