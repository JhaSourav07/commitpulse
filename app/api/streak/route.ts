// app/api/streak/route.ts
import { NextResponse } from "next/server";
import { fetchGitHubContributions } from "../../../lib/github";
import { calculateStreak } from "../../../lib/calculate";
import { generateSVG } from "../../../lib/svg/generator";
import { getSecondsUntilUTCMidnight } from "../../../utils/time";
import { BadgeParams } from "../../../types";
import { themes } from "../../../lib/svg/themes";

const ALLOWED_FONTS = new Set(["jetbrains-mono", "fira-code", "roboto-mono"]);

export async function GET(request: Request) {
  try {
    // 1. Parse URL Parameters
    const { searchParams } = new URL(request.url);
    const user = searchParams.get("user");

    if (!user) {
      return new NextResponse('Missing "user" parameter', { status: 400 });
    }

    // Look up theme from our library, fallback to 'dark'
    const themeName = searchParams.get("theme") || "dark";
    const selectedTheme = themes[themeName] || themes["dark"];
    const requestedFont = (searchParams.get("font") || "jetbrains-mono").toLowerCase();
    const selectedFont = ALLOWED_FONTS.has(requestedFont) ? requestedFont : "jetbrains-mono";

    const params: BadgeParams = {
      user,
      // Priority: URL Param > Theme Default > Fallback
      bg: searchParams.get("bg") || selectedTheme.bg,
      text: searchParams.get("text") || selectedTheme.text,
      accent: searchParams.get("accent") || selectedTheme.accent,
      radius: searchParams.get("radius") || "8",
      font: selectedFont,
    };

    // 2. Fetch Data & Calculate Stats
    const calendar = await fetchGitHubContributions(user);
    const stats = calculateStreak(calendar);

    // 3. Generate the SVG string
    const svg = generateSVG(stats, params, calendar);

    // 4. Calculate Cache Control (Reset at UTC Midnight)
    const secondsToMidnight = getSecondsUntilUTCMidnight();

    // Check if user wants to force a refresh
    const refresh = searchParams.get("refresh") === "true";
    const cacheControl = refresh
      ? "no-cache, no-store, must-revalidate"
      : `public, s-maxage=${secondsToMidnight}, stale-while-revalidate=86400`;

    // 5. Return the Image Response
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        // max-age=0 tells GitHub NOT to cache it for long
        // s-maxage=0 tells the Vercel Edge cache the same
        // must-revalidate forces the proxy to check for updates
        "Cache-Control":
          "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline';",
      },
    });
  } catch (error: any) {
    console.error("Streak API Error:", error);

    const errorSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="150" viewBox="0 0 400 150">
        <rect width="100%" height="100%" fill="#2d0000" rx="8"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffcccc" font-family="sans-serif" font-size="14">
          Error: ${error.message}
        </text>
      </svg>
    `;

    return new NextResponse(errorSvg, {
      status: 500,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache",
      },
    });
  }
}
