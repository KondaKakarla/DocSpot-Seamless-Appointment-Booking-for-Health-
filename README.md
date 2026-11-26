# DocSpot

DocSpot is a doctor appointment booking app. Patients can find doctors and manage appointments, doctors can manage their availability and bookings, and admins can review doctor applications.

## Features

- Patient, doctor, and admin accounts with role-based dashboards
- Doctor applications with admin approval
- Doctor search and appointment booking with availability checks
- Appointment document uploads, cancellation, and reschedule requests
- Doctor appointment management and patient reviews for completed appointments
- Notifications and email-based password reset
- Admin views for users, doctors, appointments, and summary counts

## Tech stack

- **Frontend:** React 18, Create React App
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB

## Requirements

- Node.js 18+ and npm
- A running MongoDB instance, local or hosted
- Docker is optional (only needed to run Mailpit for local email testing)

## Run locally

Open two terminals from the project root.

### 1. Configure and run the backend

Create `backend/.env` from the example:

```powershell
Copy-Item backend\.env.example backend\.env
```

On macOS or Linux, use:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`. Set `MONGO_DB` to your MongoDB connection string and replace `JWT_KEY` with a long, random secret. The example uses a local database at `mongodb://127.0.0.1:27017/docspot`.

Then install dependencies and start the API:

```bash
cd backend
npm install
npm run dev
```

Use `npm start` instead of `npm run dev` to start without automatic reloads. The API listens on port `8001` by default; visit [http://localhost:8001/api/health](http://localhost:8001/api/health) to check it.

### 2. Configure and run the frontend

In another terminal, create `frontend/.env` from its example:

```powershell
Copy-Item frontend\.env.example frontend\.env
```

On macOS or Linux:

```bash
cp frontend/.env.example frontend/.env
```

The default `REACT_APP_API_URL` points to `http://localhost:8001/api`. Then run:

```bash
cd frontend
npm install
npm start
```

The app opens at [http://localhost:3000](http://localhost:3000).

## Demo accounts

To create a demo admin and patient, first configure the backend `.env`, then run:

```bash
cd backend
npm run seed
```

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@docspot.com` | `admin123` |
| Patient | `user@docspot.com` | `user123` |

These are development-only credentials. Do not use them in a deployed environment.

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_DB` | Yes | MongoDB connection string |
| `JWT_KEY` | Yes | Secret used to sign authentication tokens |
| `PORT` | No | API port; defaults to `8001` |
| `FRONTEND_URL` | No | Frontend base URL used in password-reset links; defaults to `http://localhost:3000` |
| `SMTP_HOST` | For password-reset email | SMTP server hostname |
| `SMTP_PORT` | For password-reset email | SMTP server port |
| `SMTP_SECURE` | For password-reset email | Set according to your SMTP provider |
| `SMTP_USER` / `SMTP_PASS` | For authenticated SMTP | SMTP login credentials |
| `SMTP_FROM` | For password-reset email | Sender address displayed in email |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `REACT_APP_API_URL` | No | API base URL; defaults to `http://localhost:8001/api` |

Restart the frontend development server after changing its environment variables.

## Local email testing (optional)

To test password-reset emails without a real email account, run Mailpit with Docker:

```bash
docker run --rm -p 1025:1025 -p 8025:8025 axllent/mailpit
```

Set these values in `backend/.env`:

```dotenv
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
```

Open [http://localhost:8025](http://localhost:8025) to view captured email. For deployment, configure a real SMTP provider.

## Useful frontend commands

Run from `frontend`:

```bash
npm test       # Run the test runner
npm run build  # Create an optimized production build in build/
```

## Security

- Keep `.env` files and real credentials private; commit only the `.env.example` templates.
- Use a unique, strong `JWT_KEY` outside local development.
- Change or remove the demo accounts before deployment.
