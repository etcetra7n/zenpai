// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
/*import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, where, setDoc, query, getDocs, onSnapshot } from 'firebase/firestore'
import { getStorage, ref, getDownloadURL } from "firebase/storage";*/

const firebase = require("firebase/app");
const firestore = require("firebase/firestore");

//require("firebase/auth");
const Groq = require('groq-sdk');

// TODO: Replace the following with your app's Firebase project configuration
// See: https://support.google.com/firebase/answer/7015592
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

/*
async function searchDatabase(params) {
    try{
        let q = fbFirestore.collection(db, "listing");
        Object.keys(params).forEach(key => {
            console.log(`'${params[key]}'`);
            if ((params[key] != "Any") && (params[key] != '')) {
                q = fbFirestore.query(q, fbFirestore.where(key, "==", params[key]));
            }
        });
        data = [];
        const querySnapshot = await fbFirestore.getDocs(q);
        querySnapshot.forEach((doc) => {
            data.push(doc.data());
        });
        return data;
    } catch (error) {
        throw error;
    }
}
*/

async function logInstruction(instruction, file_num, script) {
    try{
        const db = firestore.getFirestore(app);
        await firestore.addDoc(firestore.collection(db, "instruct_log"), {
          instruction: instruction,
          fileNum: file_num,
          result: script
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
    "model": "llama3-8b-8192",
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
  const script = await generateScript(data.instruction, data.file_num)
  await logInstruction(data.instruction, data.file_num, script);
  return {
    statusCode: 200,
    body: JSON.stringify({ "py_script": script }),
  };
};
