// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
/*import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, where, setDoc, query, getDocs, onSnapshot } from 'firebase/firestore'
import { getStorage, ref, getDownloadURL } from "firebase/storage";*/

const firebase = require('firebase/app');
require('firebase/firestore');
require("firebase/auth");

const firebaseConfig = {
  apiKey: "AIzaSyAyEOxu3Zija0OzkqbiB8wbOsIGgXPq1sU",
  authDomain: "happyadoptorg.firebaseapp.com",
  projectId: "happyadoptorg",
  storageBucket: "happyadoptorg.appspot.com",
  messagingSenderId: "397514172189",
  appId: "1:397514172189:web:c4f40e7af324b406fba3f4",
  measurementId: "G-LZ8DKTVP4N"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(app);
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
exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  const data = JSON.parse(event.body);

  // Process the data
  console.log(data);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Data received successfully' }),
  };
};
