rmdir /s /q dist
rmdir /s /q build
pyinstaller --onedir --console --noupx --add-data="src/assets/*:assets" src/zenpai.py
@echo off
echo Press any key to continue...
pause > nul
