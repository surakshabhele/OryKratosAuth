# Ory Auth UI

A React + Vite authentication UI wired to Ory browser flows.

## Features

- Register and login screens backed by Ory browser flows
- Google social sign-in via Ory Kratos OIDC
- Forgot password flow
- Email verification screen
- Reset password flow
- Reset success screen

## Tech Stack

- React
- TypeScript
- Vite
- `@ory/client`

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Kratos for Google sign-in

Sample Kratos files live in [`kratos/`](./kratos):

- [`kratos/kratos.yml`](/home/suraksha/Projects/OryAuth/kratos/kratos.yml:1)
- [`kratos/identity.schema.json`](/home/suraksha/Projects/OryAuth/kratos/identity.schema.json:1)
- [`kratos/google.mapper.jsonnet`](/home/suraksha/Projects/OryAuth/kratos/google.mapper.jsonnet:1)

Create a Google OAuth client and add this redirect URI exactly:

```text
http://127.0.0.1:4433/self-service/methods/oidc/callback/google
```

Then replace the placeholders in `kratos.yml`:

- `YOUR_GOOGLE_CLIENT_ID`
- `YOUR_GOOGLE_CLIENT_SECRET`

The OIDC `session` hook is included so users who sign up with Google are logged in immediately after registration.

### 3. Run Ory locally

This project expects the Ory frontend API to be available locally at:

```text
http://127.0.0.1:4433
```

The Vite dev server proxies requests from `/ory` to that address. That proxy is configured in [vite.config.ts](/home/suraksha/Projects/OryAuth/vite.config.ts:1).

### 4. Start the app

```bash
npm run dev
```

Then open:

```text
http://127.0.0.1:3000/login
http://127.0.0.1:3000/register
```

### 5. Build for production

```bash
npm run build
```

### 6. Preview the production build

```bash
npm run preview
```

## Project Structure

```text
src/
  components/   Reusable auth UI pieces
  lib/          Ory client setup
  pages/        Auth screens
  App.tsx       Screen switching logic
```

## Notes

- `dist/` is generated build output and is ignored by Git.
- `node_modules/` is ignored by Git.
- Local environment files such as `.env` are ignored by Git.

## GitHub

If you are pushing this project to GitHub, commit the source files plus:

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vite.config.ts`
- `.gitignore`
- `README.md`

Do not commit:

- `node_modules/`
- `dist/`
- local editor files
- private `.env` files
