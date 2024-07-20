import { app, logEvent, analytics } from "/_js/common.js";
import { getCookie } from "/_js/cookies.js"

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});
const plan = params.plan; // "some value, perhaps undefined"
const uid = getCookie("uid");
const email = getCookie("email");
const rname = getCookie("name");

if ((uid==null)||(uid=="")){
  window.location.href = "../login?ref=sr_1_1&_encoding=UTF8&content-id=1.sym.16580515-fbf7";
}
if (plan==null){
  window.location.href = "../pricing?ref=sr_1_2&_encoding=UTF8&content-id=2.sym.16580615-fbf7";
}

let planExpiryDate = new Date();
planExpiryDate.setMonth(planExpiryDate.getMonth() + 1);
let formattedDate = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
}).format(planExpiryDate);

let accountDetails = document.getElementById("account-details");
let purchaseDetails = document.getElementById("purchase-details");

accountDetails.innerHTML = `
  <p>Name: ${rname}</p>
  <p>Email: ${email}</p>
`;
purchaseDetails.innerHTML = `
  <p>Plan name: ${plan}</p>
  <p>Validity: 1 month</p>
  <p>Expires on: ${formattedDate}</p>
`;
const price = {
 'versatile': 0.4,
 'effective': 0.5
};
window.paypal
  .Buttons({
    style: {
      shape: "pill",
      layout: "vertical",
      color: "gold",
      label: "paypal",
    },
    message: {
      amount: 8,
    },
    createOrder: (data, actions) => {
      /*let statusMsg = document.getElementById("status-msg");
      statusMsg.innerHTML = '<label><img src="../_static/loading.gif"> Please wait. Do not close the window</label>';*/
      return actions.order.create({
        purchase_units: [
            {
              description: plan +" plan",
              amount: {
                currency_code: 'USD',
                value: price[plan],
              },
            },
          ]
        });
      },
    async onApprove(data, actions) {
      try {
        console.log(data);
        const response = await fetch("http://localhost:8888/.netlify/functions/processPayment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "uid": uid,
            "plan": plan,
            "orderId": data.orderID,
          })
        });

        const orderData = await response.json();
        // Three cases to handle:
        //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
        //   (2) Other non-recoverable errors -> Show a failure message
        //   (3) Successful transaction -> Show confirmation or thank you message

        const errorDetail = orderData?.details?.[0];

        if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
          // (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
          // recoverable state, per
          // https://developer.paypal.com/docs/checkout/standard/customize/handle-funding-failures/
          return actions.restart();
        } else if (errorDetail) {
          // (2) Other non-recoverable errors -> Show a failure message
          throw new Error(`${errorDetail.description} (${orderData.debug_id})`);
        } else if (!orderData.purchase_units) {
          throw new Error(JSON.stringify(orderData));
        } else {
          // (3) Successful transaction -> Show confirmation or thank you message
          // Or go to another URL:  actions.redirect('thank_you.html');
          const transaction =
            orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
            orderData?.purchase_units?.[0]?.payments?.authorizations?.[0];
          resultMessage(
            `Transaction ${transaction.status}: ${transaction.id}<br>
          <br>See console for all available details`
          );
          console.log(
            "Capture result",
            orderData,
            JSON.stringify(orderData, null, 2)
          );
          window.location.href = `../thankyou?plan=${plan}&ref=sr_8_2&_encoding=UTF8&content-id=2.log.16580615-fvd1"`;
        }
      } catch (error) {
        console.error(error);
        resultMessage(
          `Sorry, your transaction could not be processed...<br><br>${error}`
        );
      }
    } ,
  })
  .render("#paypal-button-container"); 