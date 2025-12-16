# Final Setup: Google Cloud Service Account

You're almost done! Just need to create the service account credentials.

## 🎯 What You'll Get
A JSON file that lets your app read/write to "Zenthia Brain" sheet.

---

## Step 1: Google Cloud Console Setup

### 1.1 Open Google Cloud Console
**Click this link:** [https://console.cloud.google.com](https://console.cloud.google.com)

### 1.2 Create Project (if needed)
- Top bar → Click project dropdown
- Click "NEW PROJECT"
- Name: **Zenthia Agent**
- Click **CREATE**
- **SELECT** the project after it's created

### 1.3 Enable Google Sheets API
1. Search bar → Type "**sheets api**"
2. Click "Google Sheets API"
3. Click **ENABLE**
4. Wait ~10 seconds

---

## Step 2: Create Service Account

### 2.1 Navigate to Service Accounts
- Left menu → **IAM & Admin** → **Service Accounts**
- Click **+ CREATE SERVICE ACCOUNT**

### 2.2 Fill Details
- **Service account name**: `zenthia-memory`
- **Service account ID**: (auto-fills, leave it)
- Click **CREATE AND CONTINUE**
- **Role**: SKIP THIS (click **CONTINUE**)
- Click **DONE**

### 2.3 Create JSON Key
1. Find `zenthia-memory@...` in the list
2. Click the **⋮** (three dots) → **Manage keys**
3. **ADD KEY** → **Create new key**
4. Select **JSON**
5. Click **CREATE**
6. **File downloads** to your computer
7. **Save this file** - you'll need it in 30 seconds

---

## Step 3: Share Sheet with Service Account

### 3.1 Get Service Account Email
1. Open that downloaded JSON file
2. Find: `"client_email": "zenthia-memory@..."`
3. **Copy that full email**

### 3.2 Share Your Sheet
1. Open your "Zenthia Brain" sheet in browser
2. Click **Share** (top right)
3. **Paste** the service account email
4. Permission: **Editor**
5. **UNCHECK** "Notify people"
6. Click **Share**

✅ Done! Service account can now access your sheet.

---

## Step 4: Add JSON to .env.local

### Option A: Automated (Recommended)
Run this script I created:
\`\`\`bash
node add-credentials.js
\`\`\`

It will:
1. Ask for the path to your JSON file
2. Read it
3. Add to .env.local automatically

### Option B: Manual
1. Open the JSON file in a text editor
2. Copy **ALL** the contents
3. Open `.env.local` in your project
4. Add this line (JSON must be on ONE line):
\`\`\`
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"...",...}
\`\`\`

---

## Step 5: Test It!

\`\`\`bash
# Restart dev server
npm run dev

# In another terminal, run test
node test-api-client.js
\`\`\`

### ✅ Success indicators:
- No "No Google Sheets credentials" warnings
- You see: "Appended row to Content_Library"
- Open your Google Sheet → **Content_Library** tab has new rows!

---

## 🎉 You're Done!

Your agent is now:
- ✅ Reading best hooks from Google Sheets
- ✅ Generating content with that context
- ✅ Writing back new hooks automatically
- ✅ Learning and getting smarter over time

**Pro tip:** Check your "Zenthia Brain" sheet after each agent run to see what it learned!
