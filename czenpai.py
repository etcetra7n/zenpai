from sys import argv, modules, executable
from groq import Groq
from re import escape, search
from subprocess import check_call
from importlib.util import find_spec
import pdfkit

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

def run_zenpai(instruction, selected_files):
    client = Groq()
    file_path = ''
    if len(selected_files) > 1:
        prompt = f"You are given a list of files stored in the variable called 'files'. Write a python code to accomplish this task: \"{instruction}\" Either Save the result in the file system or print the result on screen, whichever is appropriate. Don't include any other details"
    else:
        prompt = f"You are given a {selected_files[0].split('.')[-1]} file, write a python function called 'operation(file_path)' which takes the fiole path as input and  accomplish this task: \"{instruction}\". Save the result in a new file. Don't include any other details. Alwys use fpdf module if you are dealing with pdf files"
    try:
        completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {
                    "role": "system",
                    "content": "You are good in converting instructions into python scripts"
                },
                {
                    "role": "user",
                    "content": prompt
                },
            ],
            temperature=1,
            max_tokens=1550,
            top_p=1,
            stream=True,
            stop=None,
        )
        response = ""
        for chunk in completion:
            response += chunk.choices[0].delta.content or ""
        code = response.split("```")[1]
        if code.startswith('python'):
            code = code[7:]
        if code.startswith('Python'):
            code = code[7:]
            
        print(code)
        install_required_packages(code)
        exec(code, globals())
        operation(selected_files[0])
    except:
        completion = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {
                    "role": "system",
                    "content": "You are good in converting instructions into python scripts"
                },
                {
                    "role": "user",
                    "content": prompt
                },
            ],
            temperature=1,
            max_tokens=1550,
            top_p=1,
            stream=True,
            stop=None,
        )
        response = ""
        for chunk in completion:
            response += chunk.choices[0].delta.content or ""
        code = response.split("```")[1]
        if code.startswith('python'):
            code = code[7:]
        if code.startswith('Python'):
            code = code[7:]
            
        print(code)
        install_required_packages(code)
        exec(code, globals())
        operation(selected_files[0])

if __name__ == '__main__':
    if '-c' in argv:
        args = argv[1:]
        pos = args.index('-c')
        instruction = escape(args[pos+1])
        args.pop(pos+1)
        args.pop(pos)
        selected_files = args
        print('Selected files: '+ str(selected_files))
        run_zenpai(instruction, selected_files)
    else:
        print("Please use zenpai -c {instruction} {files} format")
