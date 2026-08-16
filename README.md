# Job Application Bot

An extensible TypeScript application that discovers, filters, reviews, and applies to jobs across employment platforms. JobVision is the first working integration; Jobinja, IranTalent, and Glassdoor have adapter scaffolds ready for future implementation.

The bot is intentionally safe by default: a new installation uses `dry-run` mode and never submits an application.

## What it does

- Runs one configured job platform per execution.
- Converts platform-specific responses into one normalized job model.
- Searches for `front`, `react`, and `next` jobs by default.
- Allows onsite roles only in Tehran and remote roles anywhere.
- Rejects jobs containing `junior` by default.
- Rejects expired, previously applied, and unsupported external-application jobs.
- Blocks the complete run when JobVision CV completion is below 80%.
- Supports `dry-run`, `review`, and `automatic` modes.
- Stores durable application history and failure/skip reasons in SQLite.
- Prevents another automatic application after a successful application is recorded.

## Safety modes

| Mode | Behavior | Sends an application? |
|---|---|---|
| `dry-run` | Evaluates jobs and records what would happen | No |
| `review` | Records matching jobs as a review queue | No |
| `automatic` | Applies immediately to every eligible job | Yes |

Start in `dry-run`. Inspect the console and SQLite history, then use `review`. Only choose `automatic` after validating your filters and token.

## Architecture

```text
src/
├── domain/                 Shared job, application, and platform contracts
├── platforms/
│   ├── jobvision/          Working JobVision adapter and normalization
│   ├── jobinja/            Future adapter scaffold
│   ├── irantalent/         Future adapter scaffold
│   ├── glassdoor/          Future adapter scaffold
│   └── platform.factory.ts Selects one adapter from configuration
├── clients/                Raw platform HTTP clients
├── services/               Platform-neutral runner, matching, and orchestration
├── repositories/           Application-history contract and SQLite implementation
├── types/                  Platform API response types
└── index.ts                Composition root
```

The dependency direction is important: the bot service depends on `JobPlatform`, never on JobVision. Each adapter owns authentication, requests, pagination, response checking, and normalization. Adding a platform therefore does not require changing matching or application orchestration.

## Requirements

- Node.js 24 or newer (the project uses Node's built-in SQLite module)
- npm
- A JobVision candidate access token and client ID for the current integration

## Installation

```bash
npm install
cp .env.example .env
```

Fill in the two required JobVision values:

```dotenv
JOBVISION_ACCESS_TOKEN=your_access_token
JOBVISION_CLIENT_ID=your_client_id
```

The token may be entered with or without the `Bearer` prefix. Never commit `.env`; it is ignored by Git.

## Configuration

```dotenv
# One platform is selected per run
JOB_PLATFORM=jobvision

# dry-run | review | automatic
APPLICATION_MODE=dry-run

# Comma-separated, case-insensitive rules
JOB_KEYWORDS=front,react,next
JOB_EXCLUDED_KEYWORDS=junior
JOB_ONSITE_CITIES=tehran
JOB_ALLOW_REMOTE_EVERYWHERE=true

# A platform match score is checked when the platform supplies one
JOB_MIN_MATCH_SCORE=0

# Blocks the run before searching when platform profile completion is lower
MINIMUM_PROFILE_COMPLETION=80

JOB_PAGE_SIZE=30
JOB_MAX_PAGES=1
REQUEST_DELAY_MS=500
DATABASE_PATH=data/applications.sqlite

# Excel reporting
REPORT_DIRECTORY=reports
REPORT_TIMEZONE=Asia/Tehran
```

`JOB_KEYWORDS` uses OR logic: a job qualifies when its title/description/seniority contains at least one configured term. Any excluded keyword rejects it. Remote jobs can be anywhere; non-remote jobs must match one of `JOB_ONSITE_CITIES`.

### JobVision-specific settings

```dotenv
JOBVISION_BASE_URL=https://candidateapi.jobvision.ir
JOBVISION_WEB_APP_VERSION=19.0.153
jobCategoryUrlTitle=web-programming
```

Authentication is token-based for now. Sign-in and CAPTCHA/session automation are deliberately outside the current implementation.

## Running

Run once:

```bash
npm start
```

Development watch mode:

```bash
npm run dev
```

Before enabling automatic applications:

1. Set `APPLICATION_MODE=dry-run` and run the bot.
2. Confirm accepted and rejected jobs match your policy.
3. Set `APPLICATION_MODE=review` and inspect the review entries.
4. Set `APPLICATION_MODE=automatic` only when ready to submit real applications.

Changing to `automatic` is the explicit safety switch. No confirmation prompt appears for each job.

## Application history

SQLite data is stored at `data/applications.sqlite` by default. Every evaluated detailed job is recorded with:

- platform and platform job ID;
- title and company;
- status (`skipped`, `dry-run`, `review`, `applied`, or `failed`);
- decision/error reasons;
- platform matching score when available;
- timestamp.

Only a successful `applied` record permanently suppresses another submission. Dry-run and review entries can later be processed in automatic mode. Jobs reported as already applied by the platform are also skipped.

Each execution is stored as a distinct run, including its start/end time, result, configuration,
discovered-job count, outcome totals, and fatal error when applicable. At the end of every run,
the bot automatically writes `reports/run-000001.xlsx` (using the corresponding run ID). Each
workbook contains `Summary`, `Runs`, and `Jobs` sheets.

Export the complete database history, including legacy records that predate run tracking:

```bash
npm run report -- all
```

Export all runs and job events that occurred on a specific local calendar day:

```bash
npm run report -- day 2026-08-15
```

Export one run again by its ID:

```bash
npm run report -- run 1
```

Day boundaries and displayed timestamps use `REPORT_TIMEZONE` (`Asia/Tehran` by default).
Reports are written under `REPORT_DIRECTORY` (`reports` by default).

Example inspection with the SQLite CLI:

```bash
sqlite3 data/applications.sqlite \
  "SELECT occurred_at, platform, status, title, company, reasons FROM application_log ORDER BY id DESC;"
```

## Quality checks

```bash
npm test
npm run typecheck
npm run build
```

Tests use fake/local data and do not call JobVision or submit applications.

## Adding another platform

1. Create an adapter implementing `JobPlatform` from `src/domain/platform.ts`.
2. Keep raw HTTP code and platform response types inside that platform integration.
3. Normalize search results and details to `JobSummary` and `Job`.
4. Implement profile readiness and application submission.
5. Register the adapter in `src/platforms/platform.factory.ts`.
6. Add its credentials to configuration only when that platform is selected.
7. Add mocked adapter and mapping tests before using `automatic` mode.

The placeholder adapters currently fail with a clear “not implemented” error. They do not pretend to support application submission.

## JobVision API coverage

The JobVision implementation is based on the supplied captured collection and covers:

- `POST /api/v1/JobPost/List`
- `GET /api/v1/JobPost/Detail`
- `GET /api/v1/Cv/GetCvProgressStage`
- `POST /api/v1/Application/Apply`

The original collection is not copied into the repository because captured responses can contain personal CV and account information.

## Operational cautions

- Job platforms can change private APIs without notice.
- Automated applications may be restricted by a platform's terms; verify them before use.
- Keep request delays enabled and search limits conservative.
- Rotate a token if it is ever committed or shared.
- Back up the SQLite file if application history matters to you.
