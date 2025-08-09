import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js';
import { getAnalytics, logEvent } from'https://www.gstatic.com/firebasejs/10.12.3/firebase-analytics.js';
import { getFirestore, collection, setDoc, doc, serverTimestamp } from'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyCQEh9RtXWiQtY0Y2nTkDPuxbYEJhKTkW8",
  authDomain: "zenpai.firebaseapp.com",
  projectId: "zenpai",
  storageBucket: "zenpai.appspot.com",
  messagingSenderId: "393234421305",
  appId: "1:393234421305:web:cfa99cb18f11218043dfe8",
  measurementId: "G-FH52BJJ207"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

window.onload = function() {
  document.getElementById('newsletter-signup-btn').addEventListener('click', async(event) => {
    try {
      const email = document.getElementById("email-field").value;
      const docRef = await setDoc(doc(db, "newsletter", email), {
        "email": email,
        "created_at": serverTimestamp(),
      });
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  });
}

export { app, analytics, logEvent };
