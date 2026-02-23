document.getElementById("adminLoginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = e.target.username.value.trim();
  const password = e.target.password.value.trim();
  const msg = document.getElementById("msg");

  try {
    const res = await fetch("http://localhost:4000/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.success && data.token) {
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUsername", username);
      window.location.href = "admin.html";
    } else {
      msg.textContent = data.message || "Invalid admin credentials";
      msg.style.color = "red";
    }

  } catch (err) {
    console.error(err);
    msg.textContent = "Server error — try again.";
    msg.style.color = "red";
  }
});

/* ====================== MOBILE NAVIGATION MENU ======================== */
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-right");

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    navMenu.classList.toggle("open");
  });
}
