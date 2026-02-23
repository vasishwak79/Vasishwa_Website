const pendingContainer = document.getElementById("pending-items");

// Get real token
const token = localStorage.getItem("adminToken");

if (!token) {
  alert("Not authorized. Please log in.");
  window.location.href = "login.html";
}

async function fetchPendingItems() {
  try {
    const res = await fetch("http://localhost:4000/api/pending", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Could not fetch pending items");

    const items = await res.json();
    pendingContainer.innerHTML = "";

    if (items.length === 0) {
      pendingContainer.innerHTML = "<p>No pending items.</p>";
      return;
    }

    items.forEach(item => {
      const div = document.createElement("div");
      div.className = "item-card";
      div.innerHTML = `
        <div class="item-info">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <p><strong>Location:</strong> ${item.location}</p>
        </div>

        <div class="item-image">
          ${item.photo ? `<img src="http://localhost:4000${item.photo}" alt="${item.title}" />` : ""}
        </div>

        <div class="item-actions">
          <button class="approve-btn" onclick="approveItem(${item.id})">Approve</button>
          <button class="deny-btn" onclick="denyItem(${item.id})">Deny</button>
        </div>
      `;
      pendingContainer.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    pendingContainer.innerHTML = "<p>Error loading pending items.</p>";
  }
}

async function approveItem(id) {
  try {
    const res = await fetch(`http://localhost:4000/api/approve/${id}`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Could not approve item");

    fetchPendingItems();
  } catch (err) {
    console.error(err);
    alert("Failed to approve item");
  }
}

async function denyItem(id) {
  try {
    const res = await fetch(`http://localhost:4000/api/deny/${id}`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Could not deny item");

    fetchPendingItems();
  } catch (err) {
    console.error(err);
    alert("Failed to deny item");
  }
}

fetchPendingItems();
