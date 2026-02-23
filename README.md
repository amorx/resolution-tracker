# Resolution Tracker

A mobile-first app to track up to 5 resolutions with natural language input and LLM-powered weighting. Uses Ollama for local LLM processing.

## Features

- **Natural language input**: Type resolutions like "run 3 times a week" or "read 20 pages daily"
- **LLM parsing**: Ollama extracts measurable structure (activity, target, unit, frequency)
- **LLM weighting**: Scores each resolution on measurability, achievability, and importance
- **Progress tracking**: Log completions with increment (tap +1) or set value (enter amount)
- **Configurable tracking**: Week start, day reset, reminder preferences
- **In-app prompts**: Optional reminders when behind on targets

## Prerequisites

- Node.js 18+
- [Ollama](https://ollama.com) installed and running

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Pull an Ollama model (if not already):

   ```bash
   ollama pull gpt-oss:20b
   ```

3. Start Ollama (if not running):

   ```bash
   ollama serve
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Optional configuration

Create `.env.local`:

```
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gpt-oss:20b
```

## Tech stack

- Next.js 16 (App Router)
- Tailwind CSS
- Lucide React
- Ollama (local LLM)
- localStorage (backend-ready abstraction)
