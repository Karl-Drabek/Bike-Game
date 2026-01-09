@echo off
REM Start simple HTTP server for Bike Game
echo Starting Bike Game server...
echo Open your browser to: http://localhost:8000
echo.
python -m http.server 8000
pause
