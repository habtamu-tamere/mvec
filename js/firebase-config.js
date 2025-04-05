const firebaseConfig = {
  apiKey: "AIzaSyBbgeF-caUZf0NjGx_UGNb1xhufL345VWQ",
    authDomain: "emart-13014.firebaseapp.com",
    projectId: "emart-13014",
    storageBucket: "emart-13014.firebasestorage.app",
    messagingSenderId: "198780629457",
    appId: "1:198780629457:web:e27d80975110cd487670f0",
    measurementId: "G-BN6EHEGFR1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
