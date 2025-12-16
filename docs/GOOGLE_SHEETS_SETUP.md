# Google Sheets Setup for Memory Layer

## Quick Start

1. **Create a Google Sheet** named "Zenthia Brain" with these tabs:
   - `DailyBrief_Log`
   - `Content_Library`
   - `Metrics_Weekly`
   - `Offers_Experiments`

2. **Enable Google Sheets API**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a project
   - Enable "Google Sheets API"

3. **Create Service Account**:
   - IAM & Admin → Service Accounts → Create
   - Download JSON key file

4. **Share Sheet**:
   - Share your "Zenthia Brain" sheet with the service account email (found in JSON)
   - Give it "Editor" permissions

5. **Set Environment Variables**:
   ```bash
   # Add to .env.local:
   GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
   GOOGLE_SHEET_ID=1a2b3c4d5e6f...  # From sheet URL
   ```

## How It Works

### Read Operations
- `getBestHooks()` - Reads last 20 rows from Content_Library, returns top performers
- `getLastDailyBriefs()` - Reads recent daily briefs
- `getLatestMetrics()` - Reads most recent weekly metrics

### Write Operations (Auto-triggered)
- After ZGO runs → saves all hooks to `Content_Library`
- After Daily Brief → saves brief to `DailyBrief_Log`

### Fallback Behavior
If credentials are missing, the system **gracefully falls back** to mock data. The agent will still work, just won't persist learning.

## Sheet Structure

### Content_Library
| Date | Platform | Hook | Engagement% | Source |
|------|----------|------|-------------|--------|

### DailyBrief_Log
| Date | Focus | Actions | Yesterday Win |
|------|-------|---------|---------------|

### Metrics_Weekly
| Week Ending | Visits | Purchases | Notes |
|-------------|--------|-----------|-------|

### Offers_Experiments
| Date | Offer | Hypothesis | Status |
|------|-------|------------|--------|
