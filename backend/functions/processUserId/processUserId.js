const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-serviceAccountKey.json');
const firestore = require("firebase/firestore");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function enterUserToDatabase(userData, tempId){
  try{
      const db = admin.firestore();
      const usersRef = db.collection('users').doc(userData.uid);
      usersRef.get()
      .then((docSnapshot) => {
          if (docSnapshot.exists) {
            let updated = false;
            usersRef.onSnapshot((doc) => {
               if(!updated){
                usersRef.update({
                  "last_login_time": admin.firestore.FieldValue.serverTimestamp(),
                  "no_of_logins": admin.firestore.FieldValue.increment(1),
                  "temp_id": tempId,
                });
                updated = true;
              }
            });
          } else {
            let updated = false;
            usersRef.onSnapshot((doc) => {
              if (!updated){
                usersRef.set({
                  "name": userData.name,
                  "last_login_time": admin.firestore.FieldValue.serverTimestamp(),
                  "email": userData.email,
                  "uid": userData.uid,
                  "plan": "free",
                  "last_plan_purchase_time": admin.firestore.FieldValue.serverTimestamp(),
                  "no_of_logins": 1,
                  "temp_id": tempId,
                  "account_creation_time": admin.firestore.FieldValue.serverTimestamp(),
                });
                updated=true;
              }
          });
      }
    });
  } catch (error) {
      throw error;
  }
}

exports.handler = async (event, context) => {
  const commonHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  if (event.httpMethod == 'OPTIONS') {
    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({ message: "success" })
    };
  }
  const userIdToken = JSON.parse(event.body).userIdToken;
  const tempId = JSON.parse(event.body).temp_id;
  try {
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(userIdToken);
    await enterUserToDatabase(decodedToken, tempId);
    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({ 
        "email": decodedToken.email,
        "uid": decodedToken.uid,
      }),
    };
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return {
      statusCode: 401,
      headers: commonHeaders,
      body: JSON.stringify({ message: "Invalid" }),
    };
  }
};
