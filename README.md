# Ory Auth UI

A React + Vite authentication UI wired to Ory browser flows.

## Features

- Register and login screens backed by Ory browser flows
- Google and GitHub social sign-in via Ory Kratos OIDC
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

### 2. Configure Kratos for social sign-in

Sample Kratos files live in [`kratos/`](./kratos):

- [`kratos/kratos.yml`](/home/suraksha/Projects/OryAuth/kratos/kratos.yml:1)
- [`kratos/identity.schema.json`](/home/suraksha/Projects/OryAuth/kratos/identity.schema.json:1)
- [`kratos/google.mapper.jsonnet`](/home/suraksha/Projects/OryAuth/kratos/google.mapper.jsonnet:1)
- [`kratos/github.mapper.jsonnet`](/home/suraksha/Projects/OryAuth/kratos/github.mapper.jsonnet:1)

Create a Google OAuth client and add this redirect URI exactly:

```text
http://127.0.0.1:5443/self-service/methods/oidc/callback/google
```

If you also want GitHub sign-in, create a GitHub OAuth app and add this callback URL exactly:

```text
http://127.0.0.1:5443/self-service/methods/oidc/callback/github
```

Then create a local `.env` file from `.env.example`:

```bash
cp .env.example .env
```

```text
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
SMTP_CONNECTION_URI=smtps://test:test@mailslurper:1025/?skip_ssl_verify=true
```

You can leave the social login values blank for basic local email/password login. SMTP already defaults to MailSlurper.

Only fill the values you need:

- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for Google sign-in
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` for GitHub sign-in
- `SMTP_CONNECTION_URI` for email verification and forgot/reset password

By default, the local stack uses MailSlurper over SMTP so you can receive codes without depending on Gmail. The MailSlurper inbox UI is available at `http://127.0.0.1:7456`, and it reads mail data from `http://127.0.0.1:7457`.

If you already opened the old MailSlurper tab before, use the new URL above so the browser picks up the fresh service settings.

`docker-compose.yml` passes those env vars into the Kratos containers, and [`kratos/start.sh`](/home/suraksha/Projects/OryAuth/kratos/start.sh:1) renders the final runtime config so provider credentials and SMTP settings are not hardcoded in git.

If you want to send to a real inbox, replace the default MailSlurper URI with your SMTP provider. If you use Gmail for `SMTP_CONNECTION_URI`, use an App Password, not your normal sign-in password.

The OIDC `session` hook is included so users who sign up with Google or GitHub are logged in immediately after registration.

### 3. Run Ory locally

Start the repo's local Kratos setup with:

```bash
docker compose up -d
```

If you are following an Ory quickstart file instead of this repo's
[`docker-compose.yml`](/home/suraksha/Projects/OryAuth/docker-compose.yml:1),
start it with:

```bash
docker compose -f quickstart.yml up
```

This project expects the Ory frontend API to be available locally at:

```text
http://127.0.0.1:5443
```

The Vite dev server proxies requests from `/ory` to that address. That proxy is configured in [vite.config.ts](/home/suraksha/Projects/OryAuth/vite.config.ts:1).

### 4. Start the app

```bash
npm run dev
```

Then open:

```text
http://127.0.0.1:4455/login
http://127.0.0.1:4455/register
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
