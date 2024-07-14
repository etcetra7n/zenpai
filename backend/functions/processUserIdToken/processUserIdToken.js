const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function enterUserToDatabase(userData){
  return;
}

exports.handler = async (event, context) => {
  console.log(event.body);
  const userIdToken = JSON.parse(event.body).userIdToken;
  const commonHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type'
    /*'Access-Control-Max-Age': 259200, // 30 days*/
  };
  try {
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log(decodedToken);
    const uid = decodedToken.uid;

    // You can now use the uid to manage the user in your backend
    console.log({ message: 'User authenticated', uid });
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return {
      statusCode: 401,
      headers: commonHeaders,
      body: JSON.stringify({ message: "Invalid ID token" }),
    };
  }
  //await enterUserToDatabase(decodedToken);
  return {
    statusCode: 200,
    headers: commonHeaders,
    body: JSON.stringify({ message: "success" }),
  };
};
