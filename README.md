# AI Mystery Room

A fictional, AI-powered detective investigation. React and Vite provide the room; an Express API validates and stores each canonical case in MongoDB. Gemini runs only on the server. Before an accusation, the API returns public case data only.

## Requirements

- Node.js 20+
- MongoDB (local or managed)
- Optional Google Gemini API key

## Setup

1. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI`, `CASE_TOKEN_SECRET`, and optionally `GEMINI_API_KEY`.
2. Run `npm install`, `npm --prefix server install`, and `npm --prefix client install`.
3. Run `npm run dev` and open the Vite URL (normally http://localhost:5173).

With no Gemini key, development uses a deterministic, fully fictional case so the complete flow works without external AI calls. Set `USE_MOCK_GENERATOR=false` to require Gemini. Production requires a Gemini key and MongoDB URI.

## Configuration

See `server/.env.example`. Set `CLIENT_ORIGIN` to the deployed frontend origin. Keep all provider credentials in the server environment. Anonymous case access uses a random bearer token returned only at case creation and stored in the browser for resume.

## API

Base URL: `http://localhost:5000/api/v1`

- `GET /health`
- `POST /mysteries`
- `GET /mysteries/:caseId`
- `GET /mysteries/:caseId/evidence/:evidenceId`
- `PATCH /mysteries/:caseId/progress`
- `POST /mysteries/:caseId/accusation`
- `GET /mysteries/:caseId/result`

Case endpoints require `X-Case-Token` except where noted. Result endpoints reveal the official solution only after the final accusation.

## Deployment

Deploy the `client` directory as a static Vite site and the `server` directory as a Node service. Configure `VITE_API_BASE_URL`, `MONGODB_URI`, `GEMINI_API_KEY`, `CASE_TOKEN_SECRET`, and `CLIENT_ORIGIN`; use HTTPS and a managed MongoDB deployment. Never commit `.env` files or generated case data.

## Notes

Cases, people, messages, and reports are fictional game content. Do not enter real allegations or personal data. This initial project setup has not been tested or deployed.
