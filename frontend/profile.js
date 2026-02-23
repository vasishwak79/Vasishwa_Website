const API_URL = "http://localhost:4000/api";

const username = localStorage.getItem("username");
const token = localStorage.getItem("userToken");

/* ====================== PAGE PROTECTION ======================== */
if (!username || !token) {
  alert("You must be logged in to view your profile.");
  window.location.href = "login.html";
}


document.getElementById("profile-name").textContent = `${username}'s Profile`;

const approvedContainer = document.getElementById("approved-items");
const declinedContainer = document.getElementById("declined-items");

fetch(`${API_URL}/user/claims/${username}`)
  .then(res => res.json())
  .then(claims => {
    const approved = claims.filter(c => c.status === "approved");
    const declined = claims.filter(c => c.status === "declined");

    renderItems(approved, approvedContainer, "No approved items yet.");
    renderItems(declined, declinedContainer, "No declined items.");
  })
  .catch(err => {
    console.error(err);
    approvedContainer.innerHTML = "<p>Error loading profile.</p>";
  });


function renderItems(items, container, emptyMsg) {
  if (items.length === 0) {
    container.innerHTML = `<p class="empty-text">${emptyMsg}</p>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="claim-card" data-id="${item.id}">
      <h3>${item.title}</h3>

      ${item.photo ? 
        `<img src="http://localhost:4000${item.photo}" alt="${item.title}" />` : 
        `<p><em>No Image Available</em></p>`
      }

      <p><strong>Location:</strong> ${item.location}</p>

      <p>
        <strong>Status:</strong>
        <span class="status-label ${item.status}">
          ${item.status.toUpperCase()}
        </span>
      </p>

      <button
        class="claim-delete-btn ${item.status}"
        data-claim-id="${item.id}">
        ${item.status === "approved" ? "Delete Claimed Item" : "Delete Claim"}
      </button>
    </div>
  `).join("");

}

let isDeleting = false;

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".claim-delete-btn");
  if (!btn) return;

  if (isDeleting) return;
  isDeleting = true;

  const claimId = btn.dataset.claimId;

  if (!confirm("Are you sure you want to delete this claim?")) {
    isDeleting = false;
    return;
  }

  try {
    const res = await fetch(`${API_URL}/claims/${claimId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (data.success) {
      btn.closest(".claim-card").remove();
    } else {
      alert(data.message || "Failed to delete claim.");
    }
  } catch (err) {
    console.error(err);
    alert("Server error — try again.");
  } finally {
    isDeleting = false;
  }
});

/* ===================== USER DISPLAY + LOGOUT ===================== */
const userToken = localStorage.getItem("userToken");
const userMenu = document.getElementById("user-menu");

document.querySelectorAll("#username-display").forEach(el => {
  if (username) el.textContent = username;
});

if (username && userMenu) {
  userMenu.classList.remove("hidden");
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("username");
    window.location.href = "login.html";
  });
}

/* ====================== MOBILE NAVIGATION MENU ======================== */
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-right");

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    navMenu.classList.toggle("open");
  });
}
