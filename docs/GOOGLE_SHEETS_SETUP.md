# Google Sheets Memory Setup - Step-by-Step Guide

## 🎯 What You Need
1. A Google account (you're already logged in to Antigravity with one)
2. 10 minutes of time
3. This guide

---

## Step 1: Create the "Zenthia Brain" Google Sheet

### 1.1 Create New Sheet
1. Go to [sheets.google.com](https://sheets.google.com)
2. Click **+ Blank** to create a new sheet
3. Name it **"Zenthia Brain"** (click on "Untitled spreadsheet" at the top)

### 1.2 Create 4 Tabs
By default, you'll have "Sheet1". Rename and create tabs as follows:

**Tab 1: DailyBrief_Log**
- Rename "Sheet1" to "DailyBrief_Log"
- Add headers in row 1: `Date | Focus | Actions | Yesterday Win`

**Tab 2: Content_Library**
- Click **+** to add new sheet
- Rename to "Content_Library"
- Add headers: `Date | Platform | Hook | Engagement% | Source`

**Tab 3: Metrics_Weekly**
- Add new sheet
- Rename to "Metrics_Weekly"  
- Add headers: `Week Ending | Visits | Purchases | Notes`

**Tab 4: Offers_Experiments**
- Add new sheet
- Rename to "Offers_Experiments"
- Add headers: `Date | Offer | Hypothesis | Status`

### 1.3 Copy Sheet ID
- Look at the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
- Copy the **{SHEET_ID}** (the long string between `/d/` and `/edit`)
- Save it somewhere - you'll need it later

---

## Step 2: Set Up Google Cloud Service Account

### 2.1 Create Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project** → **NEW PROJECT**
3. Name: "Zenthia Agent" (or whatever you prefer)
4. Click **CREATE**
5. Wait for creation, then **SELECT** the project

### 2.2 Enable Google Sheets API
1. In the search bar, type "**Google Sheets API**"
2. Click on the Google Sheets API result
3. Click **ENABLE**
4. Wait for it to enable

### 2.3 Create Service Account
1. In left sidebar: **IAM & Admin** → **Service Accounts**
2. Click **+ CREATE SERVICE ACCOUNT**
3. Service account name: `zenthia-memory`
4. Service account ID: (auto-filled, leave as is)
5. Click **CREATE AND CONTINUE**
6. Role: Skip this (click **CONTINUE**)
7. Click **DONE**

### 2.4 Create JSON Key
1. Find your service account in the list
2. Click the **three dots** on the right → **Manage keys**
3. Click **ADD KEY** → **Create new key**
4. Select **JSON** format
5. Click **CREATE**
6. A JSON file downloads to your computer
7. **IMPORTANT**: Keep this file safe - it's your credential

### 2.5 Get Service Account Email
1. Open the downloaded JSON file
2. Find the line: `"client_email": "zenthia-memory@..."`
3. Copy that full email address

---

## Step 3: Share Sheet with Service Account

1. Go back to your "Zenthia Brain" Google Sheet
2. Click **Share** button (top right)
3. Paste the service account email (from step 2.5)
4. Set permission to **Editor**
5. **UNCHECK** "Notify people"
6. Click **Share**

Done! The service account can now read/write your sheet.

---

## Step 4: Add Credentials to Your Project

### 4.1 Copy JSON Content
1. Open the downloaded JSON key file in a text editor
2. Copy the **ENTIRE** contents (all the JSON)

### 4.2 Add to .env.local
1. Open your `.env.local` file in the project
2. Add these lines:

\`\`\`bash
# Google Sheets Memory
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}
GOOGLE_SHEET_ID=YOUR_SHEET_ID_FROM_STEP_1_3
\`\`\`

3. Replace the JSON value with your **actual JSON** from the file (all on one line)
4. Replace `YOUR_SHEET_ID_FROM_STEP_1_3` with your actual Sheet ID

**IMPORTANT:** The JSON must be on ONE LINE, no line breaks.

### 4.3 Verify Format
Your `.env.local` should look like:
\`\`\`bash
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"zenthia-agent-123456","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----\\n","client_email":"zenthia-memory@zenthia-agent-123456.iam.gserviceaccount.com"...}
GOOGLE_SHEET_ID=1a2b3c4d5e6f7g8h9i0j
\`\`\`

---

## Step 5: Test It!

### 5.1 Restart Dev Server
\`\`\`bash
# Stop current server (Ctrl+C)
npm run dev
\`\`\`

### 5.2 Run Test
\`\`\`bash
node test-api-client.js
\`\`\`

### 5.3 Check Your Sheet
1. Go back to "Zenthia Brain" sheet
2. Open the **Content_Library** tab
3. You should see new rows with hooks that were auto-saved!

---

## Troubleshooting

**"No Google Sheets credentials found"**
- Check that `.env.local` exists and has both variables
- Make sure JSON is on ONE line
- Restart dev server

**"Permission denied"**
- Make sure you shared the sheet with the service account email
- Double-check the Sheet ID in `.env.local`

**"Invalid JSON"**
- Escape all backslashes in private_key (`\\n` not just `\n`)
- No line breaks in the JSON value

---

## ✅ Success Indicators

When it's working, you'll see in the logs:
- No "No Google Sheets credentials" warnings
- "Appended row to Content_Library" messages
- Actual data appearing in your Google Sheet

🎉 Your agent is now learning and remembering!
