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

/*------------Redirect to login----------*/

firebase.auth().onAuthStateChanged((user) => {

  const storyEditor = document.getElementById("storyEditor");

  // Run only if we are on write page
  if (storyEditor) {
    if (!user) {
      alert("Please login to write a story");
      window.location.href = "auth.html";
    }
  }

});

/*---------------------forgot Password-----------------*/
document.getElementById("forgotPassword")?.addEventListener("click", () => {

  const email = document.getElementById("loginEmail").value;

  if (!email) {
    alert("Please enter your email in login field first");
    return;
  }

  firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      alert("Password reset email sent!");
    })
    .catch(err => alert(err.message));
});

/*----------dashboard----------*/
const auth = firebase.auth();
const db = firebase.firestore();

/* ---------------- AUTH STATE SAVE LAST LOGIN ---------------- */
auth.onAuthStateChanged(async (user) => {
  const onDashboard = document.getElementById("welcomeText");
  if (!user) return;

  const userRef = db.collection("users").doc(user.uid);
  await userRef.set(
    {
      email: user.email || "",
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (onDashboard) {
    document.getElementById("welcomeText").textContent =
      `Welcome ${user.displayName || "User"} 👋`;

    document.getElementById("userEmailText").textContent =
      user.email || "Email ID";

    const userSnap = await userRef.get();
    const data = userSnap.data();

    if (data?.lastLoginAt?.toDate) {
      document.getElementById("lastLoginText").textContent =
        `Last login: ${data.lastLoginAt.toDate().toLocaleString()}`;
      document.getElementById("profileLastLogin").textContent =
        `Last login: ${data.lastLoginAt.toDate().toLocaleString()}`;
    }

    document.getElementById("profileEmail").textContent = user.email || "Email ID";
    document.getElementById("profileName").textContent =
      user.displayName || "Your Profile";

    const avatar = user.photoURL || "";
    if (avatar) {
      document.getElementById("avatarPreview").innerHTML = `<img src="${avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      document.getElementById("modalAvatar").innerHTML = `<img src="${avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    }
  }
});

/* ---------------- LOGOUT ---------------- */
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await auth.signOut();
  window.location.href = "auth.html";
});

/* ---------------- PROFILE MODAL ---------------- */
const profileModal = document.getElementById("profileModal");
document.getElementById("openProfileBtn")?.addEventListener("click", () => {
  profileModal?.classList.add("open");
});
document.getElementById("closeProfileBtn")?.addEventListener("click", () => {
  profileModal?.classList.remove("open");
});
profileModal?.addEventListener("click", (e) => {
  if (e.target === profileModal) profileModal.classList.remove("open");
});

/* ---------------- PROFILE IMAGE PREVIEW ---------------- */
document.getElementById("profileImageInput")?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const img = `<img src="${reader.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    document.getElementById("avatarPreview").innerHTML = img;
    document.getElementById("modalAvatar").innerHTML = img;
  };
  reader.readAsDataURL(file);
});

/* ---------------- PROTECT WRITE PAGE ---------------- */
if (document.getElementById("storyEditor")) {
  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = "auth.html";
    }
  });
}

/* ---------------- FORMAT TEXT ---------------- */
function formatText(command) {
  document.execCommand(command, false, null);
}

/* ---------------- POST STORY ---------------- */
document.getElementById("postStoryBtn")?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = "auth.html";
    return;
  }

  const title = document.getElementById("storyTitle").value.trim();
  const content = document.getElementById("storyEditor").innerHTML.trim();

  if (!title || !content) {
    alert("Please fill all fields");
    return;
  }

  await db.collection("stories").add({
    title,
    content,
    uid: user.uid,
    userEmail: user.email || "Anonymous",
    displayName: user.displayName || "",
    likes: 0,
    likedBy: [],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  alert("Story published successfully!");
  window.location.href = "dashboard.html";
});

/* ---------------- MY STORIES ---------------- */
const myStoriesList = document.getElementById("myStoriesList");

function loadMyStories() {
  if (!myStoriesList) return;

  auth.onAuthStateChanged((user) => {
    if (!user) return;

    db.collection("stories")
      .where("uid", "==", user.uid)
      .orderBy("createdAt", "desc")
      .onSnapshot((snapshot) => {
        myStoriesList.innerHTML = "";

        snapshot.forEach((doc) => {
          const story = doc.data();
          const card = document.createElement("div");
          card.className = "story-card story-item show";
          card.innerHTML = `
            <h3>${story.title}</h3>
            <p>${story.content}</p>
            <div class="story-meta">
              <span>👤 ${story.userEmail || "Anonymous"}</span>
            </div>
          `;
          myStoriesList.appendChild(card);
        });
      });
  });
}
loadMyStories();

/* ---------------- DISCOVER STORIES ---------------- */
const discoverStoriesList = document.getElementById("discoverStoriesList");

function observeFadeIn(element) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  observer.observe(element);
}

function loadDiscoverStories() {
  if (!discoverStoriesList) return;

  db.collection("stories")
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
      discoverStoriesList.innerHTML = "";

      snapshot.forEach((doc) => {
        const story = doc.data();
        const card = document.createElement("div");
        card.className = "story-card story-item";

        const date = story.createdAt?.toDate
          ? story.createdAt.toDate().toLocaleString()
          : "Just now";

        card.innerHTML = `
          <h3>${story.title}</h3>
          <p>${story.content}</p>
          <div class="story-meta">
            <span>👤 ${story.userEmail || "Anonymous"}</span>
            <span>• ${date}</span>
          </div>
        `;

        discoverStoriesList.appendChild(card);
        observeFadeIn(card);
      });
    });
}
loadDiscoverStories();

/* ---------------- AUTH PAGE ACTIONS ---------------- */
document.getElementById("signupBtn")?.addEventListener("click", () => {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => window.location.href = "dashboard.html")
    .catch(err => alert(err.message));
});

document.getElementById("loginBtn")?.addEventListener("click", () => {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => window.location.href = "dashboard.html")
    .catch(err => alert(err.message));
});

document.getElementById("googleLoginBtn")?.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(() => window.location.href = "dashboard.html")
    .catch(err => alert(err.message));
});

document.getElementById("forgotPassword")?.addEventListener("click", () => {
  const email = document.getElementById("loginEmail")?.value.trim();
  if (!email) {
    alert("Please enter your email in the login field first");
    return;
  }

  auth.sendPasswordResetEmail(email)
    .then(() => alert("Password reset email sent"))
    .catch(err => alert(err.message));
});
