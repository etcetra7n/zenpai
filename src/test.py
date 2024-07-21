import re
import os

basedir = os.path.dirname(__file__)
ffmpeg_path = os.path.join(basedir, "utils", "ffmpeg.exe").replace(os.sep, "/")
print(ffmpeg_path)

def add_ffmpeg_path(script):
    pattern = re.compile("([\"'])(.*)(ffmpeg)(.*)([\"'])")
    replacement = f'\'\\2"{ffmpeg_path}"\\4\''
    script = re.sub(pattern, replacement, script)
    return(script)

script = r"""import subprocess

def operation(file_path):
    video_file = file_path
    audio_file = video_file.replace('.mp4', '.mp3')
    cmd = f'ffmpeg -i {video_file} -b:a 192K {audio_file}'
    subprocess.call(cmd, shell=True)"""
print(script)
print()

print(add_ffmpeg_path(script))
