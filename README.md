This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Prisma version note

Prisma is pinned to v6.x. Prisma v7 requires a `prisma.config.js` and removes the inline datasource `url = env(...)` used in `prisma/schema.prisma`. Do not upgrade to v7 without migrating that config.

## Deploy (Vercel + Neon)

Env vars required in Vercel Project Settings:

| Var | Value |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `EMAIL_MODE` | `resend` |
| `RESEND_API_KEY` | from resend.com |
| `EMAIL_FROM` | verified Resend sender |
| `TEAM_INBOX` | team email for order notifications |
| `CATALOGUE_BASE_URL` | `https://cleanersgallery.com.au` |

One-time DB setup (from local machine against Neon **direct** URL):
`DATABASE_URL=<neon-direct-url> npx prisma migrate deploy && DATABASE_URL=<neon-direct-url> npm run db:seed`
Then change seeded passwords / replace seed users for real staff.
