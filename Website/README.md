# Nuxt Template (Better Auth + Prisma + SQLite)

A modern, production-ready Nuxt 4 template featuring a robust authentication system, ORM integration, and a clean UI foundation.

## Features

- **Nuxt 4**: The latest and greatest from the Nuxt team.
- **Better Auth**: Comprehensive authentication with **Email OTP** support.
- **Prisma**: Type-safe ORM for interacting with the database.
- **SQLite**: Lightweight, zero-configuration database, ideal for development and small-to-medium projects.
- **Nuxt UI v3**: Beautiful, accessible, and customizable UI components built with Tailwind CSS.
- **Nodemailer**: Pre-configured for sending verification emails via Gmail.

## Stack

- **Framework**: [Nuxt](https://nuxt.com/)
- **Auth**: [Better Auth](https://www.better-auth.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [SQLite](https://sqlite.org/)
- **UI Framework**: [Nuxt UI](https://ui3.nuxt.com/)
- **Email**: [Nodemailer](https://nodemailer.com/)

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd nuxt-template
```

### 2. Install dependencies

This project uses `pnpm`, but you can use `npm` as well.

```bash
pnpm install
```

### 3. Setup Environment Variables

Copy the example environment file and fill in your details.

```bash
cp .env.example .env
```

Open `.env` and configure the following:

- `DATABASE_URL`: The SQLite connection string (default: `file:./dev.db`).
- `BETTER_AUTH_SECRET`: A secure random string for encryption. You can generate one using `openssl rand -hex 32`.
- `BETTER_AUTH_URL`: The base URL of your application (default: `http://localhost:3000`).
- `EMAIL_USER`: Your Gmail address (for OTP delivery).
- `EMAIL_PASS`: Your Gmail App Password. [How to generate an App Password](https://support.google.com/accounts/answer/185833).

### 4. Database Setup

Initialize your SQLite database and run migrations.

```bash
pnpm dlx prisma migrate dev --name init
```

Generate the Prisma client

```bash
pnpm dlx prisma generate
```

To reset the database and run the seed script:

```bash
pnpm prisma:reset
```

### 5. Start the development server

```bash
pnpm dev
```

Your application will be available at `http://localhost:3000`. This command also starts **Prisma Studio** automatically.

### 6. How to Login

Login requires an email address that already exists in the database.

- **Option A: Use the seeded user**
  Go to `/auth` and log in with `alice@a.com`.
- **Option B: Use your own email**
  Update `prisma/seed.ts` with your email, then run `pnpm prisma:reset` to re-seed.

**To get your OTP:**

- Check your configured email inbox.
- **Or**, check the **Prisma Studio** tab in your browser and look in the `Verification` table.

## Project Structure

- `app/`: Frontend code (pages, components, assets, composables).
- `server/`: Backend code (API routes, authentication logic, database utilities).
- `prisma/`: Database schema, migrations, and seed scripts.
- `public/`: Static assets.

## License

MIT
