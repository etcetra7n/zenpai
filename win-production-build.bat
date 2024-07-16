rmdir /s /q dist
rmdir /s /q build
pyinstaller --onedir --windowed --noupx --add-data="src/assets/*:assets" --icon="./assets/icon-256.ico" src/zenpai.py
echo "pyinstaller --onedir --console --noupx src/czenpai.py"
