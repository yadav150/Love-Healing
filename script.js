// Smooth scroll for all anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');

    if (targetId.length > 1) {
      e.preventDefault();
      const target = document.querySelector(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});

// Only the main "Write your story" button
const writeBtn = document.getElementById('writeBtn');

if (writeBtn) {
  writeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    alert("Login system coming soon");
  });
}

// Navbar shadow on scroll
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  if (window.scrollY > 20) {
    nav.style.boxShadow = "0 10px 30px rgba(0,0,0,0.3)";
  } else {
    nav.style.boxShadow = "none";
  }
});

// Firebase Auth instance
const auth = firebase.auth();

// Signup
const signupBtn = document.getElementById("signupBtn");
if (signupBtn) {
  signupBtn.addEventListener("click", () => {
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    auth.createUserWithEmailAndPassword(email, password)
      .then(userCredential => {
        alert("Signup successful");
        console.log(userCredential.user);
      })
      .catch(error => {
        alert(error.message);
      });
  });
}

// Login
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    auth.signInWithEmailAndPassword(email, password)
      .then(userCredential => {
        alert("Login successful");
        console.log(userCredential.user);
      })
      .catch(error => {
        alert(error.message);
      });
  });
}

// Google login
const googleLoginBtn = document.getElementById("googleLoginBtn");

if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();

    auth.signInWithPopup(provider)
      .then(result => {
        alert("Google login successful");
        console.log(result.user);
      })
      .catch(error => {
        alert(error.message);
      });
  });
}
// Elements
const userBox = document.getElementById("userBox");
const userEmailText = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");

// Listen to auth state changes
auth.onAuthStateChanged(user => {
  if (user) {
    // Show user box
    userBox.style.display = "block";

    // Display email (Google users may not always have email visible in same way)
    userEmailText.textContent = user.email || "Google User";
  } else {
    // Hide user box when logged out
    userBox.style.display = "none";
  }
});

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    auth.signOut()
      .then(() => {
        alert("Logged out");
      })
      .catch(error => {
        alert(error.message);
      });
  });
}
