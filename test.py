from requests import post

instruction = "trim trailing spaces"
request = {"file_num": 40,
          "instruction": instruction,
          "uid": "24U5hez245V2IGtW7hJZYMLNo1g1"
          }

response = post('http://localhost:8888/.netlify/functions/generateScript', json=request)
print(response.status_code)
print(response.text)
