// ------------------ TEMP MESSAGE ------------------
function showTemporaryMessage(element, text, isError = false) {
  if (!element) return;
  element.style.color = isError ? "darkRed" : "black"; // Or "green" if you prefer
  element.textContent = text;
  element.style.display = "block";

  // Clear message after 5 seconds
  setTimeout(() => {
    element.textContent = "";
    element.style.display = "none";
  }, 5000);
}

// ------------------ DISPLAY LOGGED-IN USER ------------------
const usernameElems = document.querySelectorAll("#username-display");
const username = localStorage.getItem("username");
const email = localStorage.getItem("email");
if (username && usernameElems.length > 0) {
  usernameElems.forEach(el => el.textContent = username);
}

// ------------------ LOGOUT BUTTON ------------------
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("username");
    window.location.href = "login.html";
  });
}

// ------------------ PROTECT CLAIM PAGE ------------------
const claimForm = document.getElementById("claim-form");
const userToken = localStorage.getItem("userToken");

if (claimForm && !userToken) {
  alert("You must log in to access this page.");
  window.location.href = "login.html";
}

// ------------------ HANDLE CLAIM FORM SUBMISSION ------------------
if (claimForm) {
  claimForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("claim-message");

    const itemId = localStorage.getItem("selectedItemId");

    if (!itemId) {
        alert("Error: No item selected. Please go back and select an item.");
        window.location.href = "index.html"; 
        return;
    }

    const formData = {
      item_id: itemId,
      username,
      email,
      name: e.target.name.value.trim(),
      reason: e.target.reason.value.trim(),
      features: e.target.features ? e.target.features.value.trim() : "",
      teacher: e.target.teacher.value.trim()
    };

    try {
      const res = await fetch("http://localhost:4000/api/claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userToken}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (data.success) {
        // SUCCESS: Message clears in 5s
        showTemporaryMessage(msg, "Claim submitted! Waiting for admin approval.", false);
        
        localStorage.removeItem("selectedItemId");
        e.target.reset();

      } else {
        // FAIL: Message clears in 5s
        showTemporaryMessage(msg, data.message || "Failed to submit claim.", true);
      }
    } catch (err) {
      console.error(err);
      showTemporaryMessage(msg, "Server error — try again.", true);
    }
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
