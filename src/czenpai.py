from sys import argv, executable
from re import escape, search
from requests import post
from pathlib import Path
from json import load as json_load
from os import path as os_path
import pip

import PIL
import pdfkit

basedir = os_path.dirname(__file__)

def package_exists(name):
    try:
        exec('import '+name)
    except:
        return False
    return True

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
            if hasattr(pip, 'main'):
                pip.main(['install', pkg])
            else:
                pip._internal.main(['install', pkg])
            #check_call([executable, "-m", "pip", "install", pkg])

def generate_script(instruction, selected_files):
    try:
        auth_file = Path(os_path.join(basedir, ".auth_details"))
        if not (auth_file.is_file()):
            print("You are not signed in.")
            return(1)
        request = {"file_num": len(selected_files),
                  "instruction": instruction
            }
        with open(auth_file, 'r') as f:
            auth = json_load(f)
            request['uid'] = auth['uid']
        response = post('https://zenpai.netlify.app/.netlify/functions/generateScript', json=request)
    except:
        raise
    if response.status_code == 200:
        script = response.json()['py_script']
        print(script)
        install_required_packages(script)
        if len(selected_files) == 1:
            exec(script, globals())
            operation(selected_files[0])
        else:
            exec(script, globals())
            operation(selected_files)
        return(0)
    else:
        print(response.text)
        #raise RuntimeError

if __name__ == '__main__':
    if len(argv)>=3:
        instruction = argv[1]
        selected_files = argv[2:]
        print('Instruction: '+ instruction)
        print('Selected files: '+ str(selected_files)[1:-1])
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
        