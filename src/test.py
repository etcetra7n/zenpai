from requests import get as requests_get
url = "https://zenpai.netlify.app/.netlify/functions/processTempId"
data = {'temp_id': "hello"}
response = requests_get(url, json=data, timeout=20)
