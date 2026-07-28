# WakaTime Integration

CommitPulse allows you to show your WakaTime coding statistics (total time and top languages) directly on your GitHub profile as a beautiful SVG. This is a personal integration that requires configuring your WakaTime API key on the server.

## Setup Instructions

### 1. Get Your WakaTime API Key

1. Log in to your [WakaTime account](https://wakatime.com).
2. Navigate to your [Settings](https://wakatime.com/settings).
3. Under the **Account** section, locate your **Secret API Key**.
4. Copy this key.

### 2. Configure CommitPulse

Add the key to your `.env.local` file in CommitPulse:

```env
WAKATIME_API_KEY=your_api_key_here
```

## Usage

Use the endpoint in your GitHub `README.md`:

```markdown
![WakaTime Stats](https://your-commitpulse-url.vercel.app/api/wakatime?theme=dark)
```

You can customize the SVG using standard parameters:

- `theme=github`
- `bg=0d1117`
- `accent=58a6ff`
- `text=c9d1d9`
