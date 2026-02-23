/* ===================== CHECK FOR LOGOUT MESSAGE ===================== */
// This runs immediately when the Home page loads
if (localStorage.getItem("logoutMessage") === "true") {
  alert("You've been logged out due to inactivity");
  
  // Clear the flag so the message doesn't appear again on refresh
  localStorage.removeItem("logoutMessage");
}

const API_URL = "https://www.kdmfind.com/api";

let allItems = []; 
let currentPage = 1;
const itemsPerPage = 7;

/* ===================== TEMP MESSAGES ===================== */
function showTemporaryMessage(element, text, isError = false) {
  if (!element) return;
  element.style.color = isError ? "red" : "green";
  element.innerText = text;
  element.style.display = "block";

  // Clear message after 5 seconds
  setTimeout(() => {
    element.innerText = "";
    element.style.display = "none";
  }, 5000);
}

/* ===================== CLAIM HANDLER ===================== */
function claimItem(id) {
  const userToken = localStorage.getItem("userToken");
  if (!userToken) {
    alert("You must log in to claim an item.");
    window.location.href = "login.html";
    return;
  }
  // Save ID and redirect
  localStorage.setItem("selectedItemId", id);
  window.location.href = "claim.html";
}

/* ===================== LOAD RECENT ITEMS ===================== */
const recentContainer = document.getElementById("recent-items");
if (recentContainer) {
  fetch(`${API_URL}/items?recent=true`)
    .then(res => res.json())
    .then(items => {
      recentContainer.innerHTML = items.map(item => `
        <div class="item">
          ${item.photo ? `<img src="http://localhost:4000${item.photo}" alt="${item.title}" />` : ""}
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <small>Location: ${item.location}</small><br>
          <button onclick="claimItem(${item.id})">Claim</button>
        </div>
      `).join("");
    })
    .catch(err => console.error("Recent items error:", err));
}

/* ===================== LOAD ALL ITEMS + SEARCH ===================== */
const itemsListContainer = document.getElementById("items-list");
if (itemsListContainer) {
  fetch(`${API_URL}/items`)
    .then(res => res.json())
    .then(items => {
      allItems = items;
      renderItems(allItems);
    })
    .catch(err => console.error("Load items error:", err));

  const searchBar = document.getElementById("search-bar");
  if (searchBar) {
    searchBar.addEventListener("input", e => {
      const term = e.target.value.toLowerCase();
      // Re-fetch or filter local data
      const filtered = allItems.filter(i =>
        i.title.toLowerCase().includes(term) ||
        i.description.toLowerCase().includes(term) ||
        i.location.toLowerCase().includes(term)
      );
      currentPage = 1;
      renderItems(filtered);
    });
  }
}

function renderItems(itemsToRender) {
  const container = document.getElementById("items-list");
  if (!container) return;
  
  container.innerHTML = "";
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedItems = itemsToRender.slice(start, end);

  container.innerHTML = paginatedItems.map(item => `
    <div class="item">
      <div class="item-text-content"> 
        <h1>${item.title}</h1>
        <h3>${item.description}</h3>
        <h3>Location: ${item.location}</h3><br>
      </div>
      ${item.photo ? `<img src="http://localhost:4000${item.photo}" alt="${item.title}" />` : ""}
      <button onclick="claimItem(${item.id})">Claim</button>
    </div>
  `).join("");

  renderPaginationControls(itemsToRender);
}

function renderPaginationControls(originalItems) {
  const container = document.getElementById("items-list");
  if (!container) return;

  const totalPages = Math.ceil(originalItems.length / itemsPerPage);
  if (totalPages <= 1) return; 

  const nav = document.createElement("div");
  nav.className = "pagination-nav";
  nav.style.cssText = "width:100%; display:flex; justify-content:center; gap:20px; margin-top:20px;";

  nav.innerHTML = `
    <button id="prevBtn" class="nav-btn">Previous</button>
    <span style="color: black; font-weight: bold;">Page ${currentPage} of ${totalPages}</span>
    <button id="nextBtn" class="nav-btn">Next</button>
  `;

  container.appendChild(nav);

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (currentPage === 1) prevBtn.disabled = true;
  if (currentPage === totalPages) nextBtn.disabled = true;

  prevBtn.onclick = () => {
    currentPage--;
    renderItems(originalItems);
    window.scrollTo(0, 0);
  };

  nextBtn.onclick = () => {
    currentPage++;
    renderItems(originalItems);
    window.scrollTo(0, 0);
  };
}

/* ===================== UPLOAD ITEM ===================== */
const uploadForm = document.getElementById("upload-form");
if (uploadForm) {
  uploadForm.addEventListener("submit", e => {
    e.preventDefault();

    const fileInput = document.getElementById("itemPhoto");
    const fileError = document.getElementById("file-error");
    const message = document.getElementById("upload-message"); // Get message box

    if (fileError) fileError.classList.add("hidden");

    if (!fileInput.files || fileInput.files.length === 0) {
      if (fileError) {
        fileError.textContent = "Please upload an image.";
        fileError.classList.remove("hidden");
      }
      return;
    }

    const formData = new FormData(e.target);

    fetch(`${API_URL}/items`, {
      method: "POST",
      body: formData
    })
      .then(res => res.json()) 
      .then(data => {
        const imagePreview = document.getElementById("imagePreview");

        if (data.success) {
          showTemporaryMessage(message, "Item submitted for review!", false);

          e.target.reset();
          if (imagePreview) {
            imagePreview.src = "";
            imagePreview.classList.add("hidden");
          }
          const fileName = document.getElementById("fileName");
          if (fileName) fileName.textContent = "No file selected";
        } else {

          showTemporaryMessage(message, "Upload failed", true);
        }
      })
      .catch(err => {
        console.error(err);
        showTemporaryMessage(message, "Server error", true);
      });
  });
}

// File Input Listeners
const fileInput = document.getElementById("itemPhoto");
const imagePreview = document.getElementById("imagePreview");
const fileNameDisplay = document.getElementById("fileName");

if (fileInput) {
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    const fileError = document.getElementById("file-error");
    if (fileError) fileError.classList.add("hidden");
    if (!file) return;

    if (fileNameDisplay) fileNameDisplay.textContent = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      imagePreview.src = reader.result;
      imagePreview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });
}

/* ===================== USER DISPLAY + LOGOUT ===================== */
const userToken = localStorage.getItem("userToken");
const username = localStorage.getItem("username");
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

/* ===================== PAGE PROTECTION ===================== */
if ((document.getElementById("upload-form") || document.getElementById("items-list")) && !userToken) {
  alert("You must log in to access this page.");
  window.location.href = "login.html";
}

/* ====================== MOBILE NAVIGATION MENU ======================== */
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-right");

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    navMenu.classList.toggle("open");
  });
}

