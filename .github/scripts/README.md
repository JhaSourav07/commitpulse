# 🤖 Gemini Semantic Duplicate Issue Detector

A production-ready custom GitHub Action that performs semantic search across open issues in your repository to detect and flag potential duplicates. Powered by the Google Gemini API `text-embedding-004` model.

---

## 📋 Features

- 🔍 **Semantic Search**: Understands the meaning of titles and descriptions, finding matches that simple keyword searches would miss.
- ⏳ **Rate-Limit Guard**: Automatically enforces a strict **4.1-second delay** between API requests to strictly respect the Gemini free tier limit (15 Requests Per Minute).
- 🛡️ **Anti-Spam / Idempotency**: Inspects previous bot comments to avoid duplicate warnings on the same issue.
- 🏷️ **Auto-Labeling**: Applies a `possible-duplicate` label to flagged issues.
- ⚡ **Manual Trigger**: Runs on-demand via the Actions tab using `workflow_dispatch` to control when resources and API keys are consumed.

---

## 🛠️ Setup Instructions

Follow these steps to integrate the duplicate detector into your repository.

### Step 1: Add Repository Secrets

To communicate with Google Gemini, you need a free Gemini API Key:

1. Go to [Google AI Studio](https://aistudio.google.com/) and generate a free API Key.
2. Navigate to your GitHub Repository: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
3. Create a secret named **`GEMINI_API_KEY`** and paste your API key.

### Step 2: Configure Permissions

GitHub Actions need permission to write comments and add labels to issues:

1. Navigate to: **Settings** → **Actions** → **General**.
2. Scroll to **Workflow permissions**.
3. Select **Read and write permissions**.
4. Click **Save**.

### Step 3: Run the Workflow

1. Navigate to the **Actions** tab of your repository.
2. Select **Find Semantic Duplicates** from the left-hand sidebar.
3. Click the **Run workflow** dropdown on the right and click the green button.

---

## 🤖 Example Bot Comment Format

When a duplicate is successfully detected (similarity score $\ge 0.85$), the bot will post a friendly, structured comment on the **newer issue**:

> Hey @jhasourav07! 🤖
>
> My semantic scan detected that this issue might be a duplicate of #42 (Similarity: **89.5%**).
>
> Please check between these issues and close this one if it is a duplicate.

---

## 🛡️ Robust Error Handling

The script includes several levels of robust, production-grade error handling:

- **Missing Keys**: Throws a explicit error if `GEMINI_API_KEY` or `GITHUB_TOKEN` is missing, immediately failing the step with clean diagnostic logs.
- **Failures in Embeddings API**: Catch blocks log precise error diagnostics if a request to Gemini fails.
- **Label Creation Safety**: Gracefully catches errors if the `possible-duplicate` label does not exist yet (or if the token lacks labeling permissions) to prevent the entire run from failing.

---

## ⚙️ Technical Details

### Cosine Similarity Engine

The cosine similarity calculation computes the dot product of normalized embedding vectors generated from your issue titles and descriptions:

$$\text{similarity} = \frac{A \cdot B}{\|A\| \|B\|}$$

This ensures mathematical precision across semantic features regardless of text length.

### Text Truncation

To conserve API tokens and prevent payload overflow, issue text is combined and truncated:

```javascript
const textToEmbed = `Title: ${issue.title}\nBody: ${issue.body || ''}`.slice(0, 3000);
```
