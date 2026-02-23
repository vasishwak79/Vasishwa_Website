const API_URL = "http://localhost:4000/api";
const token = localStorage.getItem("adminToken");

if (!token) {
  alert("Admin login required.");
  window.location.href = "admin_login.html";
}

const adminsGrid = document.getElementById("admins-grid");
const addBtn = document.getElementById("add-admin-btn");
const feedback = document.getElementById("admin-feedback");

/* ================= LOAD ADMINS ================= */
async function loadAdmins() {
  try {
    const res = await fetch(`${API_URL}/admin/admins`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const admins = await res.json();

    adminsGrid.innerHTML = admins.map(admin => `
      <div class="admin-card">
        <h3>${admin.username}</h3>
        <p>Role: ${admin.role.toUpperCase()}</p>
        <button data-id="${admin.id}">Remove Admin</button>
      </div>
    `).join("");

    attachAdminDeleteHandlers();

  } catch (err) {
    console.error(err);
    adminsGrid.innerHTML = "<p>Error loading admins.</p>";
  }
}

/* ================= ADD ADMIN ================= */
addBtn.addEventListener("click", async () => {
  const username = document.getElementById("new-admin-user").value.trim();
  const password = document.getElementById("new-admin-pass").value.trim();
  const role = document.getElementById("new-admin-role").value;

  if (!username || !password) {
    feedback.textContent = "All fields required.";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/admin/admins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ username, password, role })
    });

    const data = await res.json();

    if (data.success) {
      feedback.textContent = "Admin added successfully!";
      feedback.style.color = "green";
      loadAdmins();
    } else {
      feedback.textContent = data.message || "Failed to add admin.";
      feedback.style.color = "darkred";
    }
  } catch (err) {
    console.error(err);
    feedback.textContent = "Server error.";
  }
});

/* ================= DELETE ADMIN ================= */
function attachAdminDeleteHandlers() {
  document.querySelectorAll(".admin-card button").forEach(btn => {
    btn.addEventListener("click", async () => {
      const adminId = btn.dataset.id;

      if (!confirm("Remove this admin?")) return;

      try {
        const res = await fetch(`${API_URL}/admin/admins/${adminId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        const data = await res.json();

        if (data.success) {
          btn.closest(".admin-card").remove();
        } else {
          alert(data.message || "Failed to remove admin.");
        }
      } catch (err) {
        console.error(err);
        alert("Server error.");
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('new-admin-role-trigger');
    const optionsList = document.getElementById('custom-options');
    const hiddenInput = document.getElementById('new-admin-role');
    const selectedText = document.getElementById('selected-role-text');
    const optionItems = document.querySelectorAll('.custom-option');

    trigger.addEventListener('click', (e) => {
        e.stopPropagation(); 
        optionsList.classList.toggle('show');
        trigger.classList.toggle('open');
    });

    optionItems.forEach(option => {
        option.addEventListener('click', () => {
            const val = option.getAttribute('data-value');
            const text = option.textContent;

            selectedText.textContent = text;
            hiddenInput.value = val;

            // Move the 'selected' class to the clicked item
            optionItems.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');

            // Close the menu
            optionsList.classList.remove('show');
            trigger.classList.remove('open');
        });
    });

    window.addEventListener('click', () => {
        if (optionsList.classList.contains('show')) {
            optionsList.classList.remove('show');
            trigger.classList.remove('open');
        }
    });
});

loadAdmins();
