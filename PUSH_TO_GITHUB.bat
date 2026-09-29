@echo off
title Push MamaAI to GitHub
color 0B
echo ========================================================
echo        Pushing MamaAI to GitHub Repository
echo ========================================================
echo Target: https://github.com/shirshendupatra2007/Pregnency-Health-Tracking
echo.
echo If a browser window opens, please click "Authorize" or sign in to GitHub.
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  SUCCESS! Your code has been pushed to GitHub!
    echo  Visit: https://github.com/shirshendupatra2007/Pregnency-Health-Tracking
    echo ========================================================
) else (
    echo.
    echo [Notice] If Git Credential Manager prompted for sign-in or a token was needed:
    echo Please make sure you are logged into your GitHub account in your default browser.
)
echo.
pause
