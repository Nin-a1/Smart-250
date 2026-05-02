# Smart Kigali Alert 🚨

A civic issue reporting and resolution platform for Kigali, Rwanda.
Built for the SMART-250 Lyftathon — City & Community track.

## What it does

Citizens photograph urban issues (potholes, broken lights, waste, flooding).
Gemini AI analyzes the photo, identifies the issue type, searches for the
responsible Rwandan institution, and sends them an alert email automatically.

Institution agents log in, upload proof photos of fixes, and AI verifies
the resolution by comparing before and after images.

Every Friday, an automated reminder email goes to each institution that
has unresolved issues.

## Tech stack

- React 18 + TypeScript
- Chakra UI v3
- Gemini 2.0 Flash (vision + Google Search grounding)
- EmailJS (institution email delivery)
- React Router v6
- localStorage (issue persistence)

## AI flows

| Call | Trigger | What Gemini does |
|------|---------|-----------------|
| 1a | Photo upload | Vision analysis — issue type, title, severity |
| 1b | After analysis | Google Search grounding — finds real institution + email |
| 2 | On submit | Generates formal email body to institution |
| 3 | Agent resolves | Compares before/after photos, returns confidence score |
| 4 | Friday button | Generates accountability reminder for each open issue |

## Setup

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your keys:
   - `VITE_GEMINI_API_KEY` — from Google AI Studio (aistudio.google.com)
   - `VITE_EMAILJS_*` — from emailjs.com (free tier)
3. `npm install`
4. `npm run dev`

## Agent passcodes (demo)

| Institution | Passcode |
|-------------|----------|
| Rwanda Transport Development Agency | rtda2026 |
| City of Kigali — Sanitation | san2026 |
| Rwanda Energy Group | reg2026 |
| WASAC | wasac2026 |
| City of Kigali — Urban Planning | urban2026 |

## Team

Built live at SMART-250 Lyftathon 2026 — Kigali, Rwanda.
