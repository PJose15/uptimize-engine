# Google Cloud CLI Authentication Setup

## Quick Installation Guide

### Step 1: Download gcloud CLI

I've opened the download page for you. 

**Click the "Download for Windows" button** on that page.

The installer is about 85MB.

---

### Step 2: Install

1. Run the downloaded installer (`GoogleCloudSDKInstaller.exe`)
2. Follow the installation wizard
3. **Important:** Check the box that says "Run 'gcloud init'" at the end
4. Click "Finish"

---

### Step 3: Authenticate

After installation, a terminal window will open. Follow these commands:

```bash
# Authenticate with your Google account
gcloud auth application-default login

# Set your project
gcloud config set project uptimize
```

This will:
- Open your browser
- Ask you to log in to Google
- Grant permissions
- Save credentials automatically (no file downloads!)

---

### Step 4: Test

Once authenticated, run:

```bash
npm run dev
node test-api-client.js
```

Your Google Sheets memory layer will work with REAL data! 🎉

---

## Why This Works

`gcloud auth application-default login` creates credentials in a standard location that Google's libraries automatically find. No JSON files to download or manage!

The credentials are stored in:
`C:\Users\YOUR_USERNAME\AppData\Roaming\gcloud\application_default_credentials.json`

But you never have to touch that file - it just works.
