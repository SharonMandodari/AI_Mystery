# AI Mystery Room

A fictional, AI-powered detective investigation. React and Vite provide the room; an Express API validates and stores each canonical case in MongoDB. Gemini runs only on the server. Before an accusation, the API returns public case data only.

## Deploy it (Vercel + Render + MongoDB Atlas)

This repo includes a Render Blueprint at `render.yaml` and Vercel SPA routing at `client/vercel.json`. The walkthrough below deploys the frontend to Vercel, the API to Render, and stores cases in MongoDB Atlas.

### 1. Push the project to GitHub

Create a GitHub repository and push this project. Do not commit `server/.env` or `client/.env`; both are ignored by Git. Keep `server/.env.example` and `client/.env.example` as safe templates. You can check what Git will include with `git status` before pushing.

### 2. Create a MongoDB Atlas database

1. Create an Atlas account and project, then create a cluster.
2. Under **Database Access**, create a database user with a strong unique password. Use a dedicated application user; do not use your Atlas account password.
3. Under **Network Access**, add the network addresses that may reach the cluster. Render’s outbound addresses can vary by service/plan, so a temporary `0.0.0.0/0` entry is the broad compatibility option. It allows connection attempts from any IP; use a unique database user/password and review Atlas network controls. If your hosting plan provides fixed outbound IPs, allow only those IPs instead.
4. In Atlas, choose **Connect → Drivers** and copy the Node.js connection string. Replace the password placeholder and use a database name such as `ai-mystery-room` in the URI.

Atlas only accepts connections from entries in the project IP access list. See [Atlas network access documentation](https://www.mongodb.com/docs/atlas/security/ip-access-list/).

### 3. Create a Gemini API key

Create a key in [Google AI Studio](https://aistudio.google.com/apikey). It belongs only in Render’s server environment as `GEMINI_API_KEY`; do not add it to any `VITE_` variable or client file. Google’s [Gemini key guidance](https://ai.google.dev/gemini-api/docs/api-key) explains key restrictions and current key types.

### 4. Deploy the frontend to Vercel

1. In Vercel, choose **Add New → Project** and import the GitHub repository.
2. Set **Root Directory** to `client` and enable **Include source files outside of the Root Directory** only if the dashboard requests it. This app’s client is self-contained.
3. Select the Vite preset. Use `npm run build` as the build command and `dist` as the output directory. Vercel will use `client/package-lock.json` for `npm ci`.
4. Add this environment variable for **Production** (and Preview too if you plan to test preview deployments):

   ```text
   VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com/api/v1
   ```

   The service URL is a placeholder until the API is deployed; update it in Step 6.
5. Deploy and copy the Vercel production domain, for example `https://ai-mystery-room.vercel.app`.

The Vercel config rewrites client-side routes to `index.html`, so refreshing a case URL opens the React app.

### 5. Deploy the API to Render

1. In Render, choose **New → Blueprint** and select the GitHub repository containing `render.yaml`.
2. Render reads the Blueprint and sets the API root directory to `server`, installs with `npm ci`, starts with `npm start`, and checks `/api/v1/health`.
3. When prompted for the Blueprint’s unsynchronized values, enter:

   | Variable | Value |
   |---|---|
   | `CLIENT_ORIGIN` | The Vercel production origin from Step 4, with no trailing slash |
   | `MONGODB_URI` | The Atlas Node.js connection string from Step 2 |
   | `GEMINI_API_KEY` | The key from Step 3 |

   The Blueprint generates `CASE_TOKEN_SECRET` for you. It also sets `NODE_ENV=production`, `USE_MOCK_GENERATOR=false`, and the health check path. Keep all secrets in Render’s environment settings.
4. Wait for the deploy to finish. Copy the API’s `onrender.com` URL and open `https://YOUR-RENDER-SERVICE.onrender.com/api/v1/health`; it should return `{"status":"ok"}`.

Render’s [Node/Express deploy guide](https://render.com/docs/deploy-node-express-app) covers service setup. The Blueprint values are declared in [render.yaml](render.yaml).

### 6. Connect the frontend to the API

1. In Vercel, open the project’s **Settings → Environment Variables**.
2. Set `VITE_API_BASE_URL` to the actual Render URL followed by `/api/v1`, for example `https://ai-mystery-room-api.onrender.com/api/v1`.
3. Redeploy the frontend so Vite embeds the production API URL into the build.
4. In Render, confirm `CLIENT_ORIGIN` exactly matches the Vercel domain, including `https://` and excluding a trailing slash. If you use a custom frontend domain, add it to `CLIENT_ORIGIN` as a comma-separated origin and redeploy the API.

Vite variables are inserted during the build. Only the API base URL belongs in the frontend; never put MongoDB or Gemini credentials in Vercel.

### 7. Walk through the deployed app

1. Visit the Vercel site and create a case using a premise of at least 30 characters.
2. Open an evidence item, inspect a suspect, and refresh the page. The same case should resume.
3. Submit an accusation and confirm the result page shows the solution only after submission.
4. If creation fails, inspect Render logs and check `CLIENT_ORIGIN`, Atlas network access, `MONGODB_URI`, and `GEMINI_API_KEY`.

Render free web services spin down after 15 minutes without inbound traffic and can take about a minute to wake. Render explicitly positions free instances for testing and hobby projects, not production; upgrade the API service for an always-on public launch. See [Render’s free service limits](https://render.com/docs/free). The frontend shows a loading state during case generation.

## Local development

- Node.js 20+
- MongoDB (local or managed)

1. Copy `server/.env.example` to `server/.env`; set `MONGODB_URI`, `CASE_TOKEN_SECRET`, and optionally `GEMINI_API_KEY`.
2. Run `npm install`, `npm --prefix server install`, and `npm --prefix client install`.
3. Run `npm run dev` and open the Vite URL (normally http://localhost:5173).

With no Gemini key, development uses a deterministic fictional case so the flow can be explored. Production requires MongoDB, Gemini, a 32-character case-token secret, and HTTPS `CLIENT_ORIGIN` value(s).

## Environment variables

### API (`server/.env` or Render)

- `PORT`: supplied by Render; defaults to `5000` locally.
- `NODE_ENV`: `development` locally, `production` on Render.
- `CLIENT_ORIGIN`: exact frontend origin; multiple origins may be comma-separated.
- `MONGODB_URI`: MongoDB connection URI.
- `GEMINI_API_KEY`: server-side Gemini key.
- `GEMINI_MODEL`: defaults to `gemini-2.5-flash`.
- `CASE_TOKEN_SECRET`: random secret of at least 32 characters in production.
- `USE_MOCK_GENERATOR`: leave `false` in production.

### Frontend (`client/.env` or Vercel)

- `VITE_API_BASE_URL`: API origin plus `/api/v1`, such as `https://api.example.com/api/v1`.

## API

Base URL: `http://localhost:5000/api/v1`

- `GET /health`
- `POST /mysteries`
- `GET /mysteries/:caseId`
- `GET /mysteries/:caseId/evidence/:evidenceId`
- `PATCH /mysteries/:caseId/progress`
- `POST /mysteries/:caseId/accusation`
- `GET /mysteries/:caseId/result`

Case endpoints require `X-Case-Token` except health and case creation. Result endpoints reveal the official solution only after the final accusation.

## Important

Cases, people, messages, and reports are fictional game content. Do not enter real allegations or personal data. The project has not yet been deployed; after the deployment steps, verify the complete user journey in the deployed environment.
