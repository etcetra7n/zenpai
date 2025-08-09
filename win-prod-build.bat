rmdir /s /q dist
rmdir /s /q build
pyinstaller --onedir --windowed --noupx --add-data="src/assets:assets" --add-data="src/py-3.11.9-64:py-3.11.9-64" --add-data="src/utils:utils" --icon=assets/icon-64.ico src/zenpai.py
copy src\singleinstance\singleinstance.exe dist\zenpai\singleinstance.exe
@echo off
pause
