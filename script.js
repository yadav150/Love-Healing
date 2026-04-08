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

/* ---------------- SIGNUP ---------------- */
const signupBtn = document.getElementById("signupBtn");

if (signupBtn) {
  signupBtn.addEventListener("click", () => {
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    auth.createUserWithEmailAndPassword(email, password)
      .then(userCredential => {
        alert("Signup successful");
        console.log(userCredential.user);

        // clear inputs
        document.getElementById("signupEmail").value = "";
        document.getElementById("signupPassword").value = "";
      })
      .catch(error => {
        alert(error.message);
      });
  });
}

/* ---------------- LOGIN ---------------- */
const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    auth.signInWithEmailAndPassword(email, password)
      .then(userCredential => {
        alert("Login successful");
        console.log(userCredential.user);

        // clear inputs
        document.getElementById("loginEmail").value = "";
        document.getElementById("loginPassword").value = "";
      })
      .catch(error => {
        alert(error.message);
      });
  });
}

/* ---------------- GOOGLE LOGIN ---------------- */
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

/* ---------------- USER UI ---------------- */
const userBox = document.getElementById("userBox");
const userEmailText = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");

if (userBox && userEmailText) {
  auth.onAuthStateChanged(user => {
    if (user) {
      userBox.style.display = "block";
      userEmailText.textContent = user.email || "Google User";
    } else {
      userBox.style.display = "none";
    }
  });
}

/* ---------------- LOGOUT ---------------- */
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

/* ---------------- FIRESTORE INIT ---------------- */
const db = firebase.firestore();

/* ---------------- LOAD STORIES WITH LIKE BUTTON ---------------- */
const storiesList = document.getElementById("storiesList");

function loadStories() {
  if (!storiesList) return;

  db.collection("stories")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      storiesList.innerHTML = "";

      snapshot.forEach(doc => {
        const story = doc.data();
        const id = doc.id;

        const date = story.createdAt?.toDate
          ? story.createdAt.toDate().toLocaleString()
          : "Just now";

        const likes = story.likes || 0;

        const card = document.createElement("div");
        card.className = "story-card";

        card.innerHTML = `
          <h3>${story.title}</h3>
          <p>${story.content}</p>

          <div class="story-meta">
            <span>👤 ${story.userEmail || "Anonymous"}</span>
            <span>• ${date}</span>
          </div>

          <div style="margin-top:10px;">
            <button onclick="likeStory('${id}', ${likes})">
              ❤️ Like (${likes})
            </button>
          </div>
        `;

        storiesList.appendChild(card);
      });
    });
}

loadStories();

/* ---------------- LIKE FUNCTION ---------------- */
function likeStory(id, currentLikes) {
  const user = auth.currentUser;

  if (!user) {
    alert("Please login to continue ❤️");
    return;
  }

  const storyRef = db.collection("stories").doc(id);

  storyRef.get().then(doc => {
    if (!doc.exists) return;

    const data = doc.data();
    let likedBy = data.likedBy || [];

    const userId = user.uid;
    const isLiked = likedBy.includes(userId);

    if (isLiked) {
      // 💔 Unlike
      const updatedLikedBy = likedBy.filter(uid => uid !== userId);

      storyRef.update({
        likes: Math.max((data.likes || 1) - 1, 0),
        likedBy: updatedLikedBy
      });

    } else {
      // ❤️ Like
      storyRef.update({
        likes: (data.likes || 0) + 1,
        likedBy: [...likedBy, userId]
      });
    }

  }).catch(error => {
    console.error(error);
  });
}


/* ---------------- TEXT FORMATTING ---------------- */
/*
  This function applies formatting like bold, italic, underline
  using browser's execCommand (simple rich text handling)
*/
function formatText(command) {
  document.execCommand(command, false, null);
}


/* ---------------- POST STORY WITH RICH TEXT ---------------- */
const postStoryBtn = document.getElementById("postStoryBtn");

if (postStoryBtn) {
  postStoryBtn.addEventListener("click", () => {

    // Get title from input
    const title = document.getElementById("storyTitle").value.trim();

    // Get HTML content from editor (rich text)
    const content = document.getElementById("storyEditor").innerHTML.trim();

    const user = auth.currentUser;

    // Check login
    if (!user) {
      alert("Please login to post a story ❤️");
      return;
    }

    // Validation
    if (!title || !content) {
      alert("Please fill both title and story");
      return;
    }

    // Save to Firestore
    db.collection("stories").add({
      title: title,
      content: content, // HTML content stored
      userEmail: user.email || "Google User",
      userId: user.uid,
      likes: 0,
      likedBy: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      alert("Story posted successfully ✅");

      // Clear inputs after posting
      document.getElementById("storyTitle").value = "";
      document.getElementById("storyEditor").innerHTML = "";

      // Scroll to stories section
      document.getElementById("stories").scrollIntoView({ behavior: "smooth" });
    })
    .catch(error => {
      alert(error.message);
    });

  });
}

/*  Wrtite stories redirec to login page  */
firebase.auth().onAuthStateChanged((user) => {
  if (!user) {
    alert("Please login to write a story");
    window.location.href = "auth.html";
  }
});
