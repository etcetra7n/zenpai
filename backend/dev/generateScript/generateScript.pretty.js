const admin = require('firebase-admin');
const Groq = require('groq-sdk');
const serviceAccount = require('../firebase-admin-serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function getUserPlan(user_id){
  try{
      db.collection('users').doc(user_id).get()
      .then((docSnapshot) => {
        const userPlan = docSnapshot.get('plan');
        return userPlan;
      });
  } catch (error) {
      throw error;
  }
}

async function getLastHourRequests(user_id){
  try{
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      db.collection('instruct_log')
      .where('uid', '==', user_id)
      .where('timestamp', '>', oneHourAgo)
      .get()
      .then((snapshot) => {
        const count = snapshot.size;
        return count;
      });
  } catch (error) {
      throw error;
  }
}

async function logInstruction(instruction, user_id, file_num, file_type, script) {
    try{
        await db.collection('instruct_log').add({
          "instruction": instruction,
          "uid": user_id,
          "file_num": file_num,
          "file_type": file_type,
          "result": script,
          "timestamp": admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
    } catch (error) {
        throw error;
    }
}

async function generateScript(instruction, file_num, file_type) {
    const groq = new Groq();
    let prompt = "";
    if (file_num == 1) {
        prompt = `You are given a ${file_type} file, write a python function called 'operation' which takes the file path as argument and "${instruction}". Save the result in a new file. Don't include any other details`;
    } else {
        prompt = `You are given a list of files, write a python function called 'operation' which takes the list of file path as argument and "${instruction}". Save the result in new files. Don't include any other details`;
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
    "max_tokens": 2024,
    "top_p": 1,
    "stream": true,
    "stop": null
    });
    let script = "";
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
  /*
  let plan="free";
  //plan = getUserPlan(data.uid);
  let requests_last_hour = 0;
  //requests_last_hour = getLastHourRequests(data.uid);
  if (plan == "free") {
    if (data.file_num > 50){
      return {
        statusCode: 403,
        body: JSON.stringify({ "message": "Free plan users cannot run on more than 50 files. Upgrade to Versatile or Effective plan for more" }),
      };
    }
    if(requests_last_hour>30){
      return {
        statusCode: 429,
        body: JSON.stringify({ "message": "Free plan users cannot run on more than 30 runs per hour. Upgrade to Versatile or Effective plan for more" }),
      };
    }
  } else if (plan == "versatile") {
    if (data.file_num > 360){
      return {
        statusCode: 403,
        body: JSON.stringify({ "message": "Versatile plan users cannot run on more than 360 files. Upgrade to Effective plan for unlimited files" }),
      };
    }
    if(requests_last_hour>360){
      return {
        statusCode: 429,
        body: JSON.stringify({ "message": "Versatile plan users cannot run on more than 360 runs per hour. Upgrade to Effective plan for more" }),
      };
    }
  } else if (plan == "effective") {
    if(requests_last_hour>500000){
      return {
        statusCode: 429,
        body: JSON.stringify({ "message": "Effective plan users cannot run on more than 500,000 runs per hour. Request for more runs at contact@zenpai.pro" }),
      };
    }
  }*/
  let result = await generateScript(data.instruction, data.file_num, data.file_type);
  let script = result.split("```")[1];
  if (script.startsWith('python') || script.startsWith('Python')){
    script = script.substring(7);
  }
  if (script.startsWith(' ')) {
    script = script.substring(1);
  }
 //await logInstruction(data.instruction, data.uid, data.file_num, data.file_type, script);
  return {
    statusCode: 200,
    body: JSON.stringify({ "py_script": script }),
  };
};
