rmdir /s /q dist
rmdir /s /q build
python -m PyInstaller --onedir --console --noupx --add-data="src/assets/*:assets" src/zenpai.py
python -m PyInstaller --onedir --console --noupx src/czenpai.py
