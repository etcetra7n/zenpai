from sys import argv, executable
from re import escape, search
from requests import post
from pathlib import Path
from json import load as json_load
from os import path as os_path
from os import remove as del_file
import os
from subprocess import run, DEVNULL, CREATE_NO_WINDOW

basedir = os_path.dirname(__file__)
appdata_path = os_path.join(os.getenv('APPDATA'), "Zenpai")
if not os_path.exists(appdata_path):
    os.makedirs(appdata_path)
python_path = os_path.join(basedir, "py-3.11.9-64", "python.exe")
pipcheck_path = os_path.join(appdata_path, "_pipcheck.py")

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
    for line in code.split('\n'):
        if  'from' in line:
            pattern = r'from +([a-zA-Z0-9_-]+)'
            match = search(pattern, line)
            if match:
                required_packages.append(match.group(1))
        elif 'import' in line:
            pattern = r'import +([a-zA-Z0-9_-]+)'
            match = search(pattern, line)
            if match:
                required_packages.append(match.group(1))
    for pkg in required_packages:
        if not(package_exists(pkg)):
            run([python_path, "-m", "pip", "install", pkg], stdout=DEVNULL, stderr=DEVNULL, creationflags=CREATE_NO_WINDOW)

def generate_script(instruction, selected_files):
    request = {"file_num": len(selected_files),
              "instruction": instruction
        }
    print(selected_files)
    selected_files = [f.replace(os.sep, "/") for f in selected_files]
    print(selected_files)
    auth_file = os_path.join(appdata_path, "zenpai.auth")
    try:
        with open(auth_file, 'r') as f:
            auth = json_load(f)
            request['uid'] = auth['uid']
    except:
        print("You are not signed in.")
        return(1)
    try:
        response = post('https://zenpai.netlify.app/.netlify/functions/generateScript', json=request)
    except:
        raise
    if response.status_code == 200:
        script = response.json()['py_script']
        print(script)
        install_required_packages(script)
        if len(selected_files) == 1:
            script += f"\noperation(r'{selected_files[0]}')"
        else:
            script += f"\noperation({selected_files})"
        script_file = os_path.join(appdata_path, "_tempScript.py")
        with open(script_file, 'w') as f:
            f.write(script)
        run([python_path, script_file], stdout=DEVNULL, stderr=DEVNULL, creationflags=CREATE_NO_WINDOW)
        del_file(script_file)
        return(0)
    else:
        print(response.text)
        raise RuntimeError

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
