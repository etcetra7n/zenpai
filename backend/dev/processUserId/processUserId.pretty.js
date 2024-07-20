const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function enterUserToDatabase(userData, tempId){
  try{
      const db = admin.firestore();
      const userRef = db.collection('users').doc(userData.uid);
      const docSnapshot = await userRef.get();
      if (docSnapshot.exists) {
          await userRef.update({
            "last_login_time": admin.firestore.FieldValue.serverTimestamp(),
            "no_of_logins": admin.firestore.FieldValue.increment(1),
            "temp_id": tempId,
          });
      } else {
          await userRef.set({
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
      }
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
        "name": decodedToken.name,
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
