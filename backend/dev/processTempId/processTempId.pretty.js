const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-serviceAccountKey.json');
const firestore = require("firebase/firestore");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}const db = admin.firestore();

async function deleteTempIdFromDatabase(userId){
  var userRef = db.collection('users').doc(userId);
  userRef.update({
    "temp_id": 'undefined'
  });
}

async function queryTempIdFromDatabase(tempId){
  try{
      let result = null;
      const UsersRef = db.collection('users')
      const querySnapshot = await UsersRef.where("temp_id", "==", tempId).get();
      if (!querySnapshot.empty) {
        querySnapshot.forEach(async(doc) => {
          result = {
            "uid": doc.data().uid,
            "email": doc.data().email,
          };
        });
      }
    return result;
  } catch (error) {
      throw error;
  }
}

exports.handler = async (event, context) => {
  const commonHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  if (event.httpMethod == 'OPTIONS') {
    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({ message: "success" })
    };
  }
  const tempId = JSON.parse(event.body).temp_id;
  try {
    const result = await queryTempIdFromDatabase(tempId);
    if (result === null){
      return {
        statusCode: 204,
        headers: commonHeaders,
        body: JSON.stringify({ message: "No record found" }),
      };
    } else {
      // tempId expires as soon as it is read
      await deleteTempIdFromDatabase(result.uid);
      return {
        statusCode: 200,
        headers: commonHeaders,
        body: JSON.stringify(result),
      };
    }
    
  } catch (error) {
    console.error('Error in processing tempId', error);
    return {
      statusCode: 500,
      headers: commonHeaders,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
