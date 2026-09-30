@echo off
title Push Maternal-AI to GitHub
color 0B
echo ========================================================
echo        Pushing Maternal-AI to GitHub Repository
echo ========================================================
echo Target: https://github.com/shirshendupatra2007/Maternal-AI
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  SUCCESS! Your upgraded 3D website has been pushed to GitHub!
    echo  Visit: https://github.com/shirshendupatra2007/Maternal-AI
    echo ========================================================
) else (
    echo.
    echo [Notice] If Git Credential Manager prompted for sign-in or a token was needed:
    echo Please make sure you are logged into your GitHub account in your default browser.
)
echo.
pause
