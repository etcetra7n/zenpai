rmdir /s /q dist
rmdir /s /q build
pyinstaller --onedir --console --noupx --add-data="src/assets/*:assets" src/zenpai.py
pyinstaller --onedir --console --noupx src/czenpai.py
