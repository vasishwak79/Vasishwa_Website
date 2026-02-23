const pendingItemsContainer = document.getElementById("pending-items");
const pendingClaimsContainer = document.getElementById("pending-claims");

const token = localStorage.getItem("adminToken");

// ===================== SECURITY: BACK BUTTON PROTECTION =====================
window.addEventListener( "pageshow", function ( event ) {

  var historyTraversal = event.persisted || 
                         ( typeof window.performance != "undefined" && 
                              window.performance.navigation.type === 2 );
  
  // If admin used the back button, a reload is forced
  // This causes the token check below to run again.
  if ( historyTraversal ) {
    window.location.reload();
  }
});

// ===================== ADMIN ACCESS CHECK =====================
if (!token) {
  // CRITICAL: Hide the body immediately so they can't see anything 
  // while the redirect is happening.
  document.body.style.display = "none";
  window.location.href = "admin_login.html";
}

// ===================== LOGOUT LOGIC =====================

// 1. The main logout function
function performLogout(isInactivity = false) {
  // DESTROY THE TOKEN
  localStorage.removeItem("adminToken");

  if (isInactivity) {
    localStorage.setItem("logoutMessage", "true");
  }

  window.location.href = "index.html";
}

function logoutAndRedirect() {
  localStorage.removeItem("adminToken"); // Kill the session
  window.location.href = "index.html";   // Go home
}

// 3. Manual Logout Button Listener
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => performLogout(false));
}

// ===================== AUTO-LOGOUT TIMER =====================
let inactivityTimer;

function startInactivityTimer() {
  // 5 Minutes = 300000 ms
  const timeLimit = 5 * 60 * 1000; 
  
  clearTimeout(inactivityTimer);

  inactivityTimer = setTimeout(() => {
    performLogout(true);
  }, timeLimit);
}

// Listen for activity to reset timer
window.addEventListener('load', startInactivityTimer);
document.addEventListener('mousemove', startInactivityTimer);
document.addEventListener('keypress', startInactivityTimer);
document.addEventListener('click', startInactivityTimer);
document.addEventListener('scroll', startInactivityTimer);

// ===================== DATA FETCHING =====================
async function fetchPending() {
  if (!token) return; 

  try {
    const headers = { Authorization: `Bearer ${token}` };

    const [resItems, resClaims] = await Promise.all([
      fetch("http://localhost:4000/api/pending", { headers }),
      fetch("http://localhost:4000/api/claims/pending", { headers })
    ]);

    if (!resItems.ok || !resClaims.ok) throw new Error("Failed to fetch data");

    const items = await resItems.json();
    const claims = await resClaims.json();

    if (pendingItemsContainer) pendingItemsContainer.innerHTML = "";
    if (pendingClaimsContainer) pendingClaimsContainer.innerHTML = "";

    // ---------------- RENDER ITEMS ----------------
    if (items.length === 0 && pendingItemsContainer) {
       pendingItemsContainer.innerHTML = "<p>No pending items.</p>";
    } else if (pendingItemsContainer) {
       items.forEach(item => {
        const div = document.createElement("div");
        div.className = "item-card";
        div.innerHTML = `
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <p><strong>Location:</strong> ${item.location}</p>
          ${item.photo ? `<img src="http://localhost:4000${item.photo}" alt="${item.title}" />` : ""}
          <div class="action-buttons">
            <button class="approve-btn" onclick="approveItem(${item.id})">Approve</button>
            <button class="deny-btn" onclick="declineItem(${item.id})">Decline</button>
          </div>
        `;
        pendingItemsContainer.appendChild(div);
      });
    }

    // ---------------- RENDER CLAIMS ----------------
    if (claims.length === 0 && pendingClaimsContainer) {
       pendingClaimsContainer.innerHTML = "<p>No pending claims.</p>";
    } else if (pendingClaimsContainer) {
       claims.forEach(claim => {
        const div = document.createElement("div");
        div.className = "claim-card";
        div.innerHTML = `
            <h3>Claim for: ${claim.item_title || "Unknown Item"}</h3>
            ${claim.item_photo ? `<img src="http://localhost:4000${claim.item_photo}" alt="Item" />` : "<p><em>No Image Available</em></p>"}
            <p><strong>Claimed By:</strong> ${claim.name}</p>
            <p><strong>Reason:</strong> ${claim.reason}</p>
            <p><strong>Teacher:</strong> ${claim.teacher}</p>
            <p><strong>User Account:</strong> ${claim.username}</p>
            <p><strong>Email:</strong> ${claim.email}</p>
            <div class="action-buttons">
              <button class="approve-btn" onclick="approveClaim(${claim.id})">Approve</button>
              <button class="deny-btn" onclick="declineClaim(${claim.id})">Decline</button>
            </div>
        `;
        pendingClaimsContainer.appendChild(div);
      });
    }

  } catch (err) {
    console.error(err);
    if (pendingItemsContainer) pendingItemsContainer.innerHTML = "<p>Error loading data.</p>";
  }
}

// ===================== ACTIONS =====================

async function approveItem(id) {
  try {
    const res = await fetch(`http://localhost:4000/api/approve/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed");
    fetchPending();
  } catch (err) {
    console.error(err);
    alert("Could not approve item");
  }
}

async function declineItem(id) {
  if(!confirm("Are you sure you want to delete this item?")) return;
  try {
    const res = await fetch(`http://localhost:4000/api/decline/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed");
    fetchPending();
  } catch (err) {
    console.error(err);
    alert("Could not decline item");
  }
}

async function approveClaim(id) {
  try {
    const res = await fetch(`http://localhost:4000/api/claims/approve/${id}`, {
      method: "PUT",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json" 
      }
    });

    const data = await res.json();

    if (data.success) {
      alert("Claim Approved! The item has been removed from the public list.");
      fetchPending(); // Refresh the admin dashboard
    } else {
      alert("Error: " + data.message);
    }
  } catch (err) {
    console.error("Approval fetch error:", err);
    alert("Could not connect to server to approve claim.");
  }
}

async function declineClaim(id) {
  if(!confirm("Are you sure you want to deny this claim?")) return;
  try {
    const res = await fetch(`http://localhost:4000/api/claims/decline/${id}`, {
      method: "PUT", 
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Failed to decline claim");

    fetchPending();
  } catch (err) {
    console.error(err);
    alert("Could not decline claim");
  }
}

// Load pending items on page load
fetchPending();

/* ====================== MOBILE NAVIGATION MENU ======================== */
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-right");

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    navMenu.classList.toggle("open");
  });
}
