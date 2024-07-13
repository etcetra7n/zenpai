from sys import argv, executable
from re import escape, search
from subprocess import check_call
#import pdfkit
from requests import post

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
            check_call([executable, "-m", "pip", "install", pkg])

def generate_script(instruction, selected_files):
    try:
        #https://zenpai.netlify.app/.netlify/functions/zenpai
        response = post('https://zenpai.netlify.app/.netlify/functions/zenpai', 
            json={"file_num": len(selected_files),
                  "instruction": instruction
            },
        )
    except:
        raise
    if response.status_code == 200:
        print(response.text)
        script = response.json()['py_script'].split("```")[1]
        if script.startswith('python'):
            script = script[7:]
        if script.startswith('Python'):
            script = script[7:]
        print(script)
        install_required_packages(script)
        if len(selected_files) == 1:
            exec(script, globals())
            operation(selected_files[0])
        else:
            exec(script, globals())
            operation(selected_files)
    else:
        raise RuntimeError

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
        