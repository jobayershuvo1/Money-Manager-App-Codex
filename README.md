# Money Management App

Full-stack multi-user money management app built with Next.js, Tailwind CSS, PostgreSQL, Prisma, JWT cookie auth, Recharts, and OpenAI.

## Features

- Signup, login, logout, forgot password, reset password.
- Private per-user incomes, expenses, categories, budgets, and AI logs.
- Dashboard with monthly income, expenses, savings, balance, category spending.
- Income CRUD and expense CRUD with category, date, note, payment method.
- Default categories: Food, Rent, Transport, Shopping, Bills, Health, Education, Entertainment, Savings, Other.
- Custom category create, edit-ready API, delete when unused.
- Monthly reports: income vs expense, category breakdown, daily spending trend.
- Expense filters: month, category, date range, payment method.
- AI assistant parses Bengali/English expense text like `আজকে খাবারে 300 টাকা খরচ হয়েছে`.
- AI insights warn about overspending, budget pressure, and category reduction targets.
- Responsive mobile and desktop UI.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create PostgreSQL database:

```bash
createdb money_manager
```

3. Copy env file:

```bash
cp .env.example .env
```

4. Update `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/money_manager?schema=public"
JWT_SECRET="use-a-long-random-secret-with-at-least-32-chars"
APP_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4.1-mini"
```

5. Run Prisma migration:

```bash
npm run prisma:migrate
```

6. Start dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Password Reset

If SMTP env vars are missing, reset links are printed to server console in development.

SMTP vars:

```env
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
MAIL_FROM="Money Manager <no-reply@example.com>"
```

## Security Notes

- Passwords use bcrypt with 12 salt rounds.
- Auth token is stored in an httpOnly sameSite cookie.
- Every private query scopes records by authenticated `userId`.
- Inputs are validated with Zod before writes.
- Forgot password tokens are random, hashed in database, expire after 1 hour, and become single-use.
- Add production rate limiting, HTTPS-only deployment, and email provider abuse protection before public launch.

## Project Structure

```text
app/
  api/                  Next.js route handlers
  dashboard/            dashboard page
  expenses/             expense CRUD page
  incomes/              income CRUD page
  categories/           category page
  reports/              chart report page
  ai/                   AI assistant page
components/             shell, forms, charts, feature views
lib/                    auth, Prisma, validation, AI, query helpers
prisma/schema.prisma    PostgreSQL schema
```

## Production Checklist

- Set strong `JWT_SECRET`.
- Use managed PostgreSQL with SSL.
- Configure SMTP.
- Set `APP_URL` to production domain.
- Set `OPENAI_API_KEY`.
- Run `npm run build`.
- Run migrations through CI/CD or release process.
