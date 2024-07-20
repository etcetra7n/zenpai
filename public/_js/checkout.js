import { app, logEvent, analytics } from "/_js/firebase-init.js";
import { getCookie } from "/_js/cookies.js"

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});
const plan = params.plan;
const uid = getCookie("uid");
const email = getCookie("email");
const rname = getCookie("name");

if ((uid==null)||(uid=="")){
  window.location.href = "../login?ref=sr_1_1&_encoding=UTF8&content-id=1.sym.16580515-fbf7";
}
if (plan==null){
  window.location.href = "../pricing?ref=sr_1_2&_encoding=UTF8&content-id=2.sym.16580615-fbf7";
}
const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
let currentTimestamp = new Date()
let planExpiryDate = new Date();
planExpiryDate.setMonth(planExpiryDate.getMonth() + 1);
let formattedDate = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
}).format(planExpiryDate);

let accountDetails = document.getElementById("account-details");
let purchaseDetails = document.getElementById("purchase-details");
let totalAmout = document.getElementById("total-amount");
let planTitle = document.getElementById("plan-title");

planTitle.innerHTML = `${planName} plan payment`;
accountDetails.innerHTML = `
  <p>Name: ${rname}</p>
  <p>Email: ${email}</p>
`;
purchaseDetails.innerHTML = `
  <p>Plan name: ${planName}</p>
  <p>Validity: 1 month</p>
  <p>Expires on: ${formattedDate}</p>
`;

const price = {
 'versatile': '0.4',
 'effective': '0.5'
};
totalAmout.innerHTML = `<p><strong>$${price[plan]}</strong></p>`;
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
      return actions.order.create({
        purchase_units: [
            {
              description: "Zenpai "+planName +" plan",
              amount: {
                currency_code: 'USD',
                value: price[plan],
              },
            },
          ]
        });
      },
    async onApprove(data, actions) {
      let statusMsg = document.getElementById("status-msg");
      statusMsg.innerHTML = '<label><img src="../_static/loading.gif"> Please wait. Do not close the window</label>';
      try {
        await fetch("https://zenpai.netlify.app/.netlify/functions/processPayment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "uid": uid,
            "plan": plan,
            "orderId": data.orderID,
          })
        }).then(res => res)  // Parse JSON response
          .then(orderData => {
            console.log(orderData);
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
            } 
            if(orderData.status == 201) {
              // (3) Successful transaction -> Show confirmation or thank you message
              // Or go to another URL:  actions.redirect('thank_you.html');
              history.pushState({}, 'Purchase Complete', `../thankyou?plan=${plan}&ref=sr_8_2&_encoding=UTF8&content-id=2.paySuccess.78890615-fvd1`);
              document.title = "Purchase Complete";
              let checkoutPage = document.getElementById("checkout-page");
              checkoutPage.innerHTML = `
          <div id="payment-confirmation-screen">
            <h1><label><img src="../_static/success.png"> Purchase complete</label></h1>
            <div id="confirm-details">
                <p>Your payment is being processed and your account will be updated with the new plan, when the payment is confirmed. You may close this window now</p>
            </div>
            <div id="info-container" class="container-fluid row">
                <div class="col-12 col-sm-6 col-md-6 col-lg-6 col-xl-6">
                    <div class="info-box-left">
                        <label>Account details</label>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-md-6 col-lg-6 col-xl-6">
                    <div class="info-box-right" id="account-details">
                        <p>Name: ${rname}</p>
                        <p>Email: ${email}</p>
                    </div>
                </div>
            </div>
            <div id="info-container" class="container-fluid row">
                <div class="col-12 col-sm-6 col-md-6 col-lg-6 col-xl-6">
                    <div class="info-box-left">
                        <label>Plan details</label>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-md-6 col-lg-6 col-xl-6">
                    <div class="info-box-right" id="purchase-details">
                        <p>Plan name: ${planName}</p>
                        <p>Validity: 1 month</p>
                        <p>Expires on: ${formattedDate}</p>
                    </div>
                </div>
            </div>
            <div id="info-container" class="container-fluid row">
                <div class="col-12 col-sm-6 col-md-6 col-lg-6 col-xl-6">
                    <div class="info-box-left">
                        <label>Payment details</label>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-md-6 col-lg-6 col-xl-6">
                    <div class="info-box-right" id="purchase-details">
                        <p>Amount: <strong>$${price[plan]}</strong></p>
                        <p>Status: Processing</p>
                    </div>
                </div>
            </div>
            <div id="confirm-timstamp">
                <p>${currentTimestamp}</p>
            </div>
        </div>`
            }
          });
      } catch (error) {
        console.error(error);
        console.log(
          `Sorry, your transaction could not be processed...<br><br>${error}`
        );
      }
    } ,
  })
  .render("#paypal-button-container"); 