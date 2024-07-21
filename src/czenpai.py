from sys import argv
import re
from re import sub as re_sub
from requests import post
from pathlib import Path
from json import load as json_load
from os import remove as del_file
import os
from subprocess import run, DEVNULL, CREATE_NO_WINDOW

basedir = os.path.dirname(__file__)
appdata_path = os.path.join(os.getenv('APPDATA'), "Zenpai")
if not os.path.exists(appdata_path):
    os.makedirs(appdata_path)
python_path = os.path.join(basedir, "py-3.11.9-64", "python.exe")
pipcheck_path = os.path.join(appdata_path, "_pipCheck.py")
script_file = os.path.join(appdata_path, "_tempScript.py")
ffmpeg_path = os.path.join(basedir, "utils", "ffmpeg.exe").replace(os.sep, "/")

class ScriptError(Exception):
    def __init__(self, message):
        self.message = "Error running script"

def add_ffmpeg_path(script):
    pattern = re.compile("([\"'])(.*)(ffmpeg)(.*)([\"'])")
    replacement = f'\'\\2"{ffmpeg_path}"\\4\''
    script = re.sub(pattern, replacement, script)
    return(script)

def script_precheck(script):
    script = add_ffmpeg_path(script)
    return(script)

def package_exists(pkg):
    pip_check_base = '''def package_exists(pkg):
    exec('import '+pkg)
'''
    with open(pipcheck_path, 'w') as f:
        f.write(pip_check_base+f"\npackage_exists('{pkg}')")
    try:
        run([python_path, pipcheck_path], stdout=DEVNULL, stderr=DEVNULL, creationflags=CREATE_NO_WINDOW)
        del_file(pipcheck_path)
        return(True)
    except:
        del_file(pipcheck_path)
        return(False)

def install_required_packages(code):
    required_packages = []
    from_pattern = re.compile('from +([a-zA-Z0-9_]+)')
    import_pattern = re.compile('import +([a-zA-Z0-9_]+)')
    for line in code.split('\n'):
        if  'from' in line:
            match = re.search(from_pattern, line)
            if match:
                required_packages.append(match.group(1))
        elif 'import' in line:
            match = re.search(import_pattern, line)
            if match:
                required_packages.append(match.group(1))
    for pkg in required_packages:
        if not(package_exists(pkg)):
            run([python_path, "-m", "pip", "install", pkg], stdout=DEVNULL, stderr=DEVNULL, creationflags=CREATE_NO_WINDOW)

def generate_script(instruction, selected_files):
    request = {"file_num": len(selected_files),
              "instruction": instruction
        }
    selected_files = [f.replace(os.sep, "/") for f in selected_files]
    auth_file = os.path.join(appdata_path, "zenpai.auth")
    try:
        with open(auth_file, 'r') as f:
            auth = json_load(f)
            request['uid'] = auth['uid']
    except:
        print("You are not signed in.")
        return(1)

    response = post('https://zenpai.netlify.app/.netlify/functions/generateScript', json=request)
    response.raise_for_status()

    script = response.json()['py_script']
    install_required_packages(script)
    script = script_precheck(script)
    if len(selected_files) == 1:
        script += f"\noperation(r'{selected_files[0]}')"
    else:
        script += f"\noperation({selected_files})"
    
    print(script)
    with open(script_file, 'w') as f:
        f.write(script)
    result=run([python_path, script_file], capture_output=True, creationflags=CREATE_NO_WINDOW)
    del_file(script_file)
    if(result.returncode != 0):
        raise ScriptError("error running script")
    return(0)

if __name__ == '__main__':
    if len(argv)>=3:
        instruction = argv[1]
        selected_files = argv[2:]
        print('Running...')
        try:
            generate_script(instruction, selected_files)
            print("Success")
        except:
            print("Failure")
            raise
    else:
        print("""error: Minimum two arguments expected

Usage:
czenpai [instruction] [file_1] [file_2] [file_3]...
            """)
