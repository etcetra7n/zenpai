rmdir /s /q dist
rmdir /s /q build
pyinstaller --onedir --windowed --noupx --icon=assets/icon-64.ico --add-data="src/assets:assets" --add-data="src/py-3.11.9-64:py-3.11.9-64" src/zenpai.py
@echo off
echo Press any key to continue...
pause > nul
