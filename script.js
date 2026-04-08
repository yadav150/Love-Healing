// Firebase instances (ONLY ONCE)
const auth = firebase.auth();
const db = firebase.firestore();

/* ---------------- SMOOTH SCROLL ---------------- */
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

/* ---------------- WRITE BUTTON ---------------- */
const writeBtn = document.getElementById('writeBtn');

if (writeBtn) {
  writeBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      window.location.href = "auth.html";
    } else {
      window.location.href = "write.html";
    }
  });
}

/* ---------------- NAV SHADOW ---------------- */
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  nav.style.boxShadow = window.scrollY > 20
    ? "0 10px 30px rgba(0,0,0,0.3)"
    : "none";
});

/* ---------------- SIGNUP ---------------- */
document.getElementById("signupBtn")?.addEventListener("click", () => {
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(err => alert(err.message));
});

/* ---------------- LOGIN ---------------- */
document.getElementById("loginBtn")?.addEventListener("click", () => {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(err => alert(err.message));
});

/* ---------------- GOOGLE LOGIN ---------------- */
document.getElementById("googleLoginBtn")?.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();

  auth.signInWithPopup(provider)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(err => alert(err.message));
});

/* ---------------- FORGOT PASSWORD ---------------- */
document.getElementById("forgotPassword")?.addEventListener("click", () => {
  const email = document.getElementById("loginEmail")?.value.trim();

  if (!email) {
    alert("Please enter your email first");
    return;
  }

  auth.sendPasswordResetEmail(email)
    .then(() => alert("Password reset email sent"))
    .catch(err => alert(err.message));
});

/* ---------------- USER UI ---------------- */
const userBox = document.getElementById("userBox");
const userEmailText = document.getElementById("userEmail");

auth.onAuthStateChanged(user => {
  if (user && userBox && userEmailText) {
    userBox.style.display = "block";
    userEmailText.textContent = user.email || "Google User";
  } else if (userBox) {
    userBox.style.display = "none";
  }
});

/* ---------------- LOGOUT ---------------- */
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  auth.signOut().then(() => {
    window.location.href = "auth.html";
  });
});

/* ---------------- LOAD STORIES ---------------- */
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

/* ---------------- LIKE STORY ---------------- */
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
      const updatedLikedBy = likedBy.filter(uid => uid !== userId);

      storyRef.update({
        likes: Math.max((data.likes || 1) - 1, 0),
        likedBy: updatedLikedBy
      });
    } else {
      storyRef.update({
        likes: (data.likes || 0) + 1,
        likedBy: [...likedBy, userId]
      });
    }

  });
}

/* ---------------- WRITE PAGE PROTECTION ---------------- */
if (document.getElementById("storyEditor")) {
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "auth.html";
    }
  });
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
    likes: 0,
    likedBy: [],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  alert("Story published successfully!");
  window.location.href = "dashboard.html";
});
