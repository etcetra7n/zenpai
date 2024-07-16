import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCQEh9RtXWiQtY0Y2nTkDPuxbYEJhKTkW8",
  authDomain: "zenpai.firebaseapp.com",
  projectId: "zenpai",
  storageBucket: "zenpai.appspot.com",
  messagingSenderId: "393234421305",
  appId: "1:393234421305:web:cfa99cb18f11218043dfe8",
  measurementId: "G-FH52BJJ207"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function sendUserIdToBackend(userIdToken, tempId) {
  //https://zenpai.netlify.app/.netlify/functions/processUserIdToken
  //localhost:8888/.netlify/functions/processUserIdToken
  try{
    const response = await fetch('http://localhost:8888/.netlify/functions/processUserId', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "userIdToken": await userIdToken,
            "tempId": await tempId,
        })
      });
   
  return await response.json();
  } catch(error) {
    console.error('Error sending ID token to backend:', error);
  }
}
let googleSignInBtn = document.getElementById('google-sign-in-btn');

googleSignInBtn.addEventListener('click', async => {
  const provider = new GoogleAuthProvider();
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  const tempId = params.tempId; // "some value, perhaps undefined"
  googleSignInBtn.remove();
  let statusMsg = document.getElementById("status-msg");
  statusMsg.innerHTML = `<img src="../_static/loading.gif"> Waiting for confirmation`;
  signInWithPopup(auth, provider)
    .then(async(result) => {
      //const credential = GoogleAuthProvider.credentialFromResult(result);
      //const token = credential.accessToken;
      const userIdToken = await result.user.getIdToken();
      const userDetails = await sendUserIdToBackend(userIdToken, tempId);
      return userDetails

    }).then((userDetails) => {
      const redirect_url = params.then;
      const temp_id = params.tempId;
      if(redirect_url !== null){
        window.location.href = redirect_url;
      } else {
        if (temp_id !== null){
          //const loginScreen = document.getElementById('login-screen-container');
          let googleSignInBtn = document.getElementById("google-sign-in-btn");
          if (googleSignInBtn !== null){
            googleSignInBtn.remove();
          }
          let statusMsg = document.getElementById("status-msg");
          statusMsg.innerHTML = 
          `
          <img src="../_static/success.png"> You are now logged in as ${userDetails.email}
          `;
        } else {
          window.location.href = location.protocol+"//"+location.hostname+"/pricing";
        }
      }
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      //const credential = GoogleAuthProvider.credentialFromError(error);
      console.error('Error during sign-in: ', errorCode, errorMessage);
      throw error;
    });
});