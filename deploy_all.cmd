@echo off
setlocal

REM Deploys latest code to GitHub and Supabase.
REM Requires SUPABASE_ACCESS_TOKEN to be set in the environment.

cd /d "%~dp0"

git add -A
git commit -m "Deploy updates" || echo No changes to commit.
git push || goto :error

if "%SUPABASE_ACCESS_TOKEN%"=="" (
  echo SUPABASE_ACCESS_TOKEN is not set.
  echo Set it once with: setx SUPABASE_ACCESS_TOKEN "YOUR_TOKEN"
  exit /b 1
)

npx.cmd supabase functions deploy polymarket-trader || goto :error

echo.
echo Deploy complete.
exit /b 0

:error
echo.
echo Deploy failed.
exit /b 1
