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

window.onload = function() {
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

};