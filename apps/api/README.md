# API (NestJS + Prisma + PostgreSQL)

## Local development

1) Configure env

```bash
cd apps/api
cp .env.example .env
```

2) Start local PostgreSQL and keep `DATABASE_URL` valid

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/money_mobile?schema=public"
```

3) Migrate and seed

```bash
cd apps/api
npm install
npx prisma migrate dev --name init
npm run prisma:seed
```

4) Start API

```bash
cd apps/api
npm run dev
```

Local API: `http://localhost:3000`  
Swagger: `http://localhost:3000/docs`

## Cloud deployment (Render)

This repo includes a blueprint file at project root: `render.yaml`.

1) Push code to GitHub (same branch that contains `render.yaml`)
2) In Render, choose **New + > Blueprint**
3) Select your repository and deploy
4) After first deploy, open the web service env vars and set:

- `PUBLIC_BASE_URL=https://<your-api-domain>`
- `CORS_ORIGIN=` (optional, leave empty for mobile app)

Render will run:

- Build: `npm ci && npm run build`
- Start: `npm run deploy:start` (includes `prisma migrate deploy`)

Health check: `/health`

## Mobile app connection after backend goes live

After you get the cloud backend URL:

1) In `apps/mobile`, set:

```env
EXPO_PUBLIC_API_URL=https://<your-api-domain>
```

2) Rebuild the APK, then install the new APK on phone.

## Main endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /categories`
- `POST /categories`
- `GET /transactions`
- `POST /transactions`
- `PUT /transactions/:id`
- `DELETE /transactions/:id`

All non-auth endpoints require:

```http
Authorization: Bearer <token>
```
