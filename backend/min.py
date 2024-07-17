from os import system as os_system

commands = [
    "uglifyjs -o functions/generateScript/generateScript.js --compress --mangle --warn dev/generateScript/generateScript.pretty.js",

    "uglifyjs -o functions/processTempId/processTempId.js --compress --mangle --warn dev/processTempId/processTempId.pretty.js",

    "uglifyjs -o functions/processUserId/processUserId.js --compress --mangle --warn dev/processUserId/processUserId.pretty.js"
]

for com in commands:
    os_system(com)
