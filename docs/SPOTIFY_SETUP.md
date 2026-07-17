# Spotify "Currently Playing" Integration

CommitPulse allows you to show what you're currently listening to on Spotify, directly on your GitHub profile. This is an optional feature and requires you to set up a Spotify Developer app to securely fetch your playback data.

## Setup Instructions

### 1. Create a Spotify Developer App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and log in.
2. Click **Create an App**.
3. Fill in the App name (e.g. "CommitPulse Github Profile") and App description.
4. Set the **Redirect URI** to \`http://localhost:3000/api/auth/callback/spotify\` (or your production callback URL).
5. Agree to the terms and click **Save**.
6. Note down your **Client ID** and **Client Secret**.

### 2. Get a Refresh Token

Since the Spotify token expires every hour, we need a long-lived **Refresh Token** to automatically fetch new access tokens in the background.

You can easily get a Refresh Token using Spotify's authorization flow:

1. Copy this URL, replace `YOUR_CLIENT_ID` with your actual Client ID, and open it in your browser:
   \`\`\`
   https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost:3000/api/auth/callback/spotify&scope=user-read-currently-playing
   \`\`\`
2. Agree to the permissions.
3. You will be redirected to \`http://localhost:3000/...\` with a \`?code=...\` parameter in the URL. Copy this **code**.
4. Run the following cURL command (replace \`YOUR_CLIENT_ID\`, \`YOUR_CLIENT_SECRET\`, and \`YOUR_CODE\`):
   \`\`\`bash
   curl -X POST https://accounts.spotify.com/api/token \
    -d "grant_type=authorization_code" \
    -d "code=YOUR_CODE" \
    -d "redirect_uri=http://localhost:3000/api/auth/callback/spotify" \
    -H "Authorization: Basic $(echo -n YOUR_CLIENT_ID:YOUR_CLIENT_SECRET | base64)" \
    -H "Content-Type: application/x-www-form-urlencoded"
   \`\`\`
5. In the JSON response, copy the \`refresh_token\`.

### 3. Configure CommitPulse

Add these keys to your \`.env.local\` file in CommitPulse:

\`\`\`env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REFRESH_TOKEN=your_refresh_token
\`\`\`

## Usage

Use the endpoint in your GitHub `README.md`:

\`\`\`markdown
![Currently Playing](https://your-commitpulse-url.vercel.app/api/spotify?theme=dark)
\`\`\`

You can customize the SVG using standard parameters:

- \`theme=github\`
- \`bg=0d1117\`
- \`accent=1db954\` (Spotify Green)
