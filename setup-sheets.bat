@echo off
REM Quick setup script to add Google Sheets credentials to .env.local

echo =========================================
echo Zenthia Brain - Google Sheets Setup
echo =========================================
echo.

REM Extract Sheet ID from browser (you'll paste this)
set /p SHEET_ID="Paste your Sheet ID from the URL (the long string between /d/ and /edit): "

echo.
echo Adding GOOGLE_SHEET_ID to .env.local...

REM Check if .env.local exists
if not exist .env.local (
    echo Creating .env.local file...
    echo # LLM API Keys > .env.local
    echo GEMINI_API_KEY=your_key_here >> .env.local
    echo OPENAI_API_KEY=your_key_here >> .env.local
    echo ANTHROPIC_API_KEY=your_key_here >> .env.local
    echo. >> .env.local
)

REM Add Google Sheets config
echo # Google Sheets Memory Layer >> .env.local
echo GOOGLE_SHEET_ID=%SHEET_ID% >> .env.local
echo.

echo ✅ Sheet ID added to .env.local!
echo.
echo =========================================
echo NEXT STEP: Add Service Account Credentials
echo =========================================
echo.
echo 1. Go to: https://console.cloud.google.com
echo 2. Create a project (or select existing)
echo 3. Enable "Google Sheets API"
echo 4. Create Service Account
echo 5. Download JSON key
echo 6. Add to .env.local as GOOGLE_APPLICATION_CREDENTIALS_JSON
echo.
echo See docs/GOOGLE_SHEETS_SETUP.md for detailed steps.
echo.
pause
