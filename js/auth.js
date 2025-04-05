// Phone number authentication
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const phone = document.getElementById('phone').value;
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const userType = document.getElementById('userType').value;
        
        // Format phone for Ethiopia
        const formattedPhone = `+251${phone.substring(1)}`;
        
        // Send verification code
        const appVerifier = new firebase.auth.RecaptchaVerifier('signupForm', {
            'size': 'invisible',
            'callback': (response) => {
                // reCAPTCHA solved, proceed with phone auth
                const provider = new firebase.auth.PhoneAuthProvider();
                provider.verifyPhoneNumber(formattedPhone, appVerifier)
                    .then((verificationId) => {
                        // Show OTP input form
                        showOTPForm(verificationId, {phone, name, email, userType});
                    })
                    .catch((error) => {
                        console.error(error);
                        alert('Error sending verification code: ' + error.message);
                    });
            }
        });
        
        firebase.auth().signInWithPhoneNumber(formattedPhone, appVerifier)
            .then((confirmationResult) => {
                window.confirmationResult = confirmationResult;
                showOTPForm(null, {phone, name, email, userType});
            })
            .catch((error) => {
                console.error(error);
                alert('Error sending verification code: ' + error.message);
            });
    });
}

function showOTPForm(verificationId, userData) {
    const authContainer = document.querySelector('.auth-container');
    authContainer.innerHTML = `
        <h2>Verify Phone</h2>
        <p>We sent a code to ${userData.phone}</p>
        <form id="otpForm">
            <div class="form-group">
                <label for="otp">6-digit code</label>
                <input type="text" id="otp" maxlength="6" required>
            </div>
            <button type="submit" class="btn-primary">Verify</button>
        </form>
    `;
    
    const otpForm = document.getElementById('otpForm');
    otpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = document.getElementById('otp').value;
        
        if (window.confirmationResult) {
            window.confirmationResult.confirm(code)
                .then((result) => {
                    // User signed in
                    createUserProfile(result.user, userData);
                })
                .catch((error) => {
                    alert('Invalid code. Please try again.');
                });
        } else {
            // Alternative verification flow if needed
            const credential = firebase.auth.PhoneAuthProvider.credential(verificationId, code);
            firebase.auth().signInWithCredential(credential)
                .then((result) => {
                    createUserProfile(result.user, userData);
                })
                .catch((error) => {
                    alert('Invalid code. Please try again.');
                });
        }
    });
}

function createUserProfile(user, userData) {
    const userRef = db.collection('users').doc(user.uid);
    
    const userProfile = {
        phone: userData.phone,
        name: userData.name,
        email: userData.email || '',
        userType: userData.userType,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        addresses: [],
        paymentMethods: []
    };
    
    if (userData.userType === 'seller') {
        userProfile.sellerStatus = 'pending'; // Needs admin approval
        userProfile.storeName = '';
        userProfile.storeDescription = '';
    }
    
    userRef.set(userProfile)
        .then(() => {
            if (userData.userType === 'seller') {
                alert('Your seller account is pending approval. You will be notified once approved.');
                window.location.href = 'index.html';
            } else {
                window.location.href = 'index.html';
            }
        })
        .catch((error) => {
            console.error('Error creating user profile:', error);
            alert('Error creating profile. Please try again.');
        });
}

// Login functionality
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const phone = document.getElementById('loginPhone').value;
        const formattedPhone = `+251${phone.substring(1)}`;
        
        const appVerifier = new firebase.auth.RecaptchaVerifier('loginForm', {
            'size': 'invisible'
        });
        
        firebase.auth().signInWithPhoneNumber(formattedPhone, appVerifier)
            .then((confirmationResult) => {
                window.confirmationResult = confirmationResult;
                showOTPForm(null, {phone});
            })
            .catch((error) => {
                console.error(error);
                alert('Error sending verification code: ' + error.message);
            });
    });
}

// Auth state listener
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        console.log('User signed in:', user.uid);
        
        // Check if user is on auth pages and redirect
        if (window.location.pathname.includes('login.html') || 
            window.location.pathname.includes('signup.html')) {
            // Check user type and redirect accordingly
            db.collection('users').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        if (userData.userType === 'seller' && userData.sellerStatus === 'approved') {
                            window.location.href = 'vendor-dashboard.html';
                        } else if (userData.userType === 'admin') {
                            window.location.href = 'admin-dashboard.html';
                        } else {
                            window.location.href = 'index.html';
                        }
                    }
                });
        }
    } else {
        // User is signed out
        console.log('User signed out');
        
        // Redirect to login if on protected pages
        const protectedPages = ['vendor-dashboard.html', 'admin-dashboard.html', 'checkout.html'];
        if (protectedPages.some(page => window.location.pathname.includes(page))) {
            window.location.href = 'login.html';
        }
    }
});
