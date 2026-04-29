# Stock News Bot

A TypeScript bot that fetches daily company news from Finnhub and sends curated updates to a Telegram chat.

## Example Output

![Stock News Bot Example](./example.png)

## What It Does

- Tracks a fixed watchlist: `MSFT`, `MCO`, `V`, `KO`
- Fetches news for the previous day (based on Singapore date)
- Filters articles to keep only items that mention the ticker or company name
- Sends up to 5 matching articles per symbol to Telegram in HTML format
- Runs automatically every day at **09:30 Asia/Singapore**

## How News Is Filtered

For each symbol, an article is kept only if its headline or summary contains at least one of:

- The symbol (e.g. `MSFT`)
- The mapped company name (e.g. `Microsoft`)
- The possessive company name form (e.g. `Microsoft's`)

## Prerequisites

- Node.js 18+ (recommended)
- npm
- A Telegram bot token (via BotFather)
- A Telegram chat ID where messages should be sent
- A Finnhub API key

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root:

```bash
BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
FINNHUB_API_KEY=your_finnhub_api_key
```

## Run Locally

### Development (with nodemon)

```bash
npm start
```

### Type Check

```bash
npm run typecheck
```

### Build

```bash
npm run build
```

## Run with PM2

After building:

```bash
npm run process:start
```

Stop process:

```bash
npm run process:stop
```

## Scheduling Details

- Cron expression: `30 9 * * *`
- Timezone: `Asia/Singapore`
- Effective behavior: sends the prior day’s news once daily at 09:30 SGT

## Project Structure

```text
src/
  index.ts    # Scheduler, filtering, formatting, Telegram send logic
  finnhub.ts  # Finnhub API client wrapper
```
