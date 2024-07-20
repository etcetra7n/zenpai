const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();
PAYPAL_CLIENT_ID = "AZ-K0LRTSdV6F7Nqj0h9_CryYlgmSkeo7CdiCQJQp-iQN9B_bN0UqGs3kUW94VO1jp-mMrBQHS_I_fDL"
PAYPAL_CLIENT_SECRET = "EBKQsfWqHV9wFdsYpkdX4W94oUexM-C9Il65A1AbaYvZuqNMHkIaUwVwfp1insBIotqRJ_ucQsFTImGC"

const generateAccessToken = async () => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    const auth = Buffer.from(
      PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET
    ).toString("base64");
    const response = await fetch(`https://api-m.sandbox.paypal.com/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Failed to generate Access Token:", error);
  }
};

async function updatePlan(uid, plan){
  try{
      const userRef = db.collection('users').doc(uid);

      let planExpiryDate = new Date();
      planExpiryDate.setMonth(planExpiryDate.getMonth() + 1);

      await userRef.update({
        "last_plan_purchase_time": admin.firestore.FieldValue.serverTimestamp(),
        "plan_expiry_date": planExpiryDate,
        "plan": plan,
      });
  } catch (error) {
      throw error;
  }
}
async function logPayment(uid, plan, orderDetails) {
    try{
        await db.collection('payment_log').add({
          "uid": uid,
          "plan": plan,
          "order_details": JSON.stringify(orderDetails),
          "timestamp": admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log("data added to firestore");
        return;
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
  const data = JSON.parse(event.body);
  const accessToken = await generateAccessToken();
  try {
    const orderDetails = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${data.orderId}/capture`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
    });
    console.log(orderDetails);
    await logPayment(data.uid, data.plan, orderDetails);
    if (orderDetails.status == 200){
      await updatePlan(data.uid, data.plan);
      return {
        statusCode: 200,
        headers: commonHeaders,
        body: JSON.stringify(orderDetails),
      };
    } else {
      return {
        statusCode: 402,
        headers: commonHeaders,
        body: JSON.stringify(orderDetails),
      };
    }
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return {
      statusCode: 401,
      headers: commonHeaders,
      body: JSON.stringify({ message: "Invalid" }),
    };
  }
};
