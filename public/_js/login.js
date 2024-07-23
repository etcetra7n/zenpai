import { app, logEvent, analytics } from "/_js/firebase-init.js";
import { setCookie, getCookie } from "/_js/cookies.js"
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

const auth = getAuth(app);

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});
const tempId = params.tempId; // "some value, perhaps undefined"
const redirect_url = params.then;
const purchase_action = params.purchaseAction;

async function sendUserIdToBackend(userIdToken, tempId) {
  try{
    const response = await fetch('https://zenpai.netlify.app/.netlify/functions/processUserId', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "userIdToken": await userIdToken,
            "temp_id": await tempId,
        })
      });
  return await response.json();
  } catch(error) {
    console.error('Error sending ID token to backend:', error);
    logEvent(analytics, 'crash', { name: 'send_user_id_to_backend'});
  }
}
let googleSignInBtn = document.getElementById('google-sign-in-btn');

googleSignInBtn.addEventListener('click', async => {
  const provider = new GoogleAuthProvider();
  googleSignInBtn.remove();
  let statusMsg = document.getElementById("status-container");
  let bottomLabel = document.getElementById("bottom-label");
  statusMsg.innerHTML = `<img id="status-img" width="50" src="../_static/loading.gif"><br>
    <label id="status-msg">Please wait...<label>`;
  bottomLabel.style.marginTop = '140px';
  
  signInWithPopup(auth, provider)
    .then(async(result) => {
      //const credential = GoogleAuthProvider.credentialFromResult(result);
      //const token = credential.accessToken;
      const userIdToken = await result.user.getIdToken();
      const userDetails = await sendUserIdToBackend(userIdToken, tempId);
      return userDetails;

    }).then((userDetails) => {
      setCookie("uid", userDetails.uid, 7);
      setCookie("email", userDetails.email, 7);
      setCookie("name", userDetails.name, 7);
      if (purchase_action !== null){
        window.location.href = `../checkout?plan=${purchase_action}&ref=xv_7_1&_encoding=UTF8&content-id=0.sym.88650515-fbf7`;
      }
      if(redirect_url !== null){
        window.location.href = redirect_url;
      } 
      if (tempId !== null){
        let googleSignInBtn = document.getElementById("google-sign-in-btn");
        if (googleSignInBtn !== null){
          googleSignInBtn.remove();
        }
        let statusMsg = document.getElementById("status-container");
        let bottomLabel = document.getElementById("bottom-label");
        statusMsg.innerHTML = `
        <img id="status-img" width="60" src="../_static/success.png"><br>
        <label id="status-msg">You are now logged in as ${userDetails.email}<br>You may close this window</label>
        `;
        bottomLabel.style.marginTop = '105px';
      } else {
        window.location.href = "../pricing?ref=xc_3_1&_encoding=UTF8&content-id=5.sym.17580515-fbf2";
      }
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      //const credential = GoogleAuthProvider.credentialFromError(error);
      console.error('Error during sign-in: ', errorCode, errorMessage);
      logEvent(analytics, 'crash', { name: 'auth_sign_in'});
      throw error;
    });
});