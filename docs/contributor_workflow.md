# 🤖 Automated Contributor Workflow

CommitPulse features a fully custom, GitHub Actions-powered **Issue Management System** designed for large open-source events like GSSoC. We built an anti-hoarding, self-service automation layer right into the repository:

- **Structured Issue Templates:** We use specific templates for Bug Reports and Feature Requests to maintain high quality and clarity. Please ensure you provide all necessary context requested in the templates to speed up review.
- **Self-Claiming:** Issue authors can grab their issues instantly by commenting `/claim` (only the author of the issue can claim it, unless the issue is older than 1 week and has no assignees, or it was authored by `jhasourav07`, in which case anyone can claim it).
- **Fair Play:** A strict one-active-issue-per-contributor rule prevents issue hoarding.
- **Stale Expiry:** A scheduled cron job automatically unassigns inactive contributors after 2 days.
- **Self-Service Labels:** Anyone can tag issues using `/addlabel <tag>` or remove labels using `/removelabel <tag>` comments.
- **Semantic Duplicate Detection:** An AI-powered duplicate detector automatically scans open issues using the Google Gemini API (`gemini-embedding-001`) to generate vector embeddings. It calculates cosine similarity and flags potential duplicate issues with a comment and a `possible-duplicate` label.

This ensures maintainers aren't bottlenecks and the community moves incredibly fast. Feel free to explore the GitHub Action workflows in the `.github/workflows/` directory to learn more about the implementation.
