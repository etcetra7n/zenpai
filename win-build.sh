rmdir dist
rmdir build
python -m PyInstaller --onedir -w --noconfirm --add-data="src/assets/*;assets" src/zenpai.py
