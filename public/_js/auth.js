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
const googleSignInBtn = document.getElementById('googleSignInBtn');

async function sendIdTokenToBackend(idToken) {
  //https://zenpai.netlify.app/.netlify/functions/processUserIdToken
  fetch('http://localhost:8888/.netlify/functions/processUserIdToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      "userIdToken": idToken,
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Server response:', data);
  })
  .catch(error => {
    console.error('Error sending ID token to backend:', error);
  });
}

googleSignInBtn.addEventListener('click', async => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then(async(result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      //const token = credential.accessToken;
      const userIdToken = await result.user.getIdToken();
      console.log(userIdToken);
      await sendIdTokenToBackend(userIdToken);
      // The signed-in user info.
      //const user = result.user;
      //console.log('User signed in: ', user);
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.customData.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      console.error('Error during sign-in: ', errorCode, errorMessage, email, credential);
    });
});