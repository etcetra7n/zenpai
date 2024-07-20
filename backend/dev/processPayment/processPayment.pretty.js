const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

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
          "uid": instruction,
          "plan": user_id,
          "order_details": orderDetails,
          "timestamp": admin.firestore.FieldValue.serverTimestamp(),
        });
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
  try {
    fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${order.orderId}/capture`, {
        method: 'POST',
        headers: {
            'PayPal-Request-Id': '7b92603e-77ed-4896-8e78-5dea2050476a',
            'Authorization': 'Bearer access_token6V7rbVwmlM1gFZKW_8QtzWXqpcwQ6T5vhEGYNJDAAdn3paCgRpdeMdVYmWzgbKSsECednupJ3Zx5Xd-g'
        }
    }).then((response) => {
      const orderDetails = JSON.parse(response.body)
      await logPayment(data.uid, data.plan, orderDetails);
      if (orderDetails.status == "COMPLETED"){
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
    });
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return {
      statusCode: 401,
      headers: commonHeaders,
      body: JSON.stringify({ message: "Invalid" }),
    };
  }
};
