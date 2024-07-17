const firebase = require("firebase/app");
const firestore = require("firebase/firestore");

//require("firebase/auth");
const Groq = require('groq-sdk');

const firebaseConfig = {
  apiKey: "AIzaSyCQEh9RtXWiQtY0Y2nTkDPuxbYEJhKTkW8",
  authDomain: "zenpai.firebaseapp.com",
  projectId: "zenpai",
  storageBucket: "zenpai.appspot.com",
  messagingSenderId: "393234421305",
  appId: "1:393234421305:web:cfa99cb18f11218043dfe8",
  measurementId: "G-FH52BJJ207"
};
const app = firebase.initializeApp(firebaseConfig);

async function logInstruction(instruction, file_num, script) {
    try{
        const db = firestore.getFirestore(app);
        await firestore.addDoc(firestore.collection(db, "instruct_log"), {
          instruction: instruction,
          fileNum: file_num,
          result: script,
          timestamp: firestore.serverTimestamp(),
        });
    } catch (error) {
        throw error;
    }
}

async function generateScript(instruction, file_num) {
    const groq = new Groq();
    let prompt = "";
    if (file_num == 1) {
        prompt = `You are given a txt file, write a python function called 'operation' which takes the file path as argument and "${instruction}". Save the result in a new file. Don't include any other details`
    } else {
        prompt = `You are given a list of files, write a python function called 'operation' which takes the list of file path as argument and "${instruction}". Save the result in new files. Don't include any other details`
    }
    const chatCompletion = await groq.chat.completions.create({
    "messages": [
      {
        "role": "system",
        "content": "You are good in converting instructions into python scripts"
      },
      {
        "role": "user",
        "content": prompt
      }
    ],
    "model": "llama3-70b-8192",
    "temperature": 1,
    "max_tokens": 3024,
    "top_p": 1,
    "stream": true,
    "stop": null
    });
    let script = ""
    for await (const chunk of chatCompletion) {
        script += chunk.choices[0]?.delta?.content || '';
    }
    return script;
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }
  const data = JSON.parse(event.body);
  plan = getUserPlan(data.uid);
  requests_last_hour = getLastHourRequests(data.uid);
  if (plan == "free") {
    if (data.file_num > 50){
      return {
        statusCode: 403,
        body: JSON.stringify({ "message": "Free plan users cannot run on more than 50 files. Upgrade to Versatile or Effective plan for more" }),
      };
    }
  } else if (plan == "versatile") {
    if (data.file_num > 360){
      return {
        statusCode: 403,
        body: JSON.stringify({ "message": "Versatile plan users cannot run on more than 360 files. Upgrade to Effective plan for more" }),
      };
    }
  }
  /*} else if (plan == "effective") {
      
  }*/
  let result = await generateScript(data.instruction, data.file_num);
  let script = result.split("```")[1];
  if (script.startsWith('python') || script.startsWith('Python')){
    script = script.substring(7);
  }
  await logInstruction(data.instruction, data.file_num, script);
  return {
    statusCode: 200,
    body: JSON.stringify({ "py_script": script }),
  };
};
