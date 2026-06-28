@echo off
title JobPulse Portal Updater
echo ========================================================
echo             JOBPULSE LOCAL PORTAL UPDATER              
echo ========================================================
echo.
echo [1/4] Installing Node.js dependencies...
call npm install
echo.
echo [2/4] Running job scraper (fetching RSS feeds)...
node scripts/update-jobs.js
echo.
echo [3/4] Staging database changes...
git add jobs-database.json
echo.
echo [4/4] Committing and pushing to GitHub...
git commit -m "Auto-update government and local job listings (Local Run)"
git push
echo.
echo ========================================================
echo UPDATE SUCCESSFUL! Vercel will rebuild the site shortly.
echo ========================================================
echo.
pause
