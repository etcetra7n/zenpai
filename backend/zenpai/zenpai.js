// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
/*import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, where, setDoc, query, getDocs, onSnapshot } from 'firebase/firestore'
import { getStorage, ref, getDownloadURL } from "firebase/storage";*/

const fbApp = require('firebase/app');
const fbFirestore = require('firebase/firestore');
const fbStorage = require('firebase/storage');

const firebaseConfig = {
  apiKey: "AIzaSyAyEOxu3Zija0OzkqbiB8wbOsIGgXPq1sU",
  authDomain: "happyadoptorg.firebaseapp.com",
  projectId: "happyadoptorg",
  storageBucket: "happyadoptorg.appspot.com",
  messagingSenderId: "397514172189",
  appId: "1:397514172189:web:c4f40e7af324b406fba3f4",
  measurementId: "G-LZ8DKTVP4N"
};

const app = fbApp.initializeApp(firebaseConfig);
const db = fbFirestore.getFirestore(app);

function getQueryParams(params) {
    const queryParams = {};
    for (const [key, value] of Object.entries(params)) {
        if(value == "Any"){
            continue;
        }
        else{
            queryParams[key] = value;
        }
    }
    return queryParams;
}
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

const handler = async (event) => {
  // Apply CORS headers
    const queryParams = getQueryParams(event.queryStringParameters);
    const data = await searchDatabase(queryParams);
    if (data.length == 0){
        const response = {
            statusCode: 404,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({"error": "404"}),
        };
        return response;
    } else {
        const response = {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify(data),
        };
        return response;
    }
}
module.exports = { handler }
