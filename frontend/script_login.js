if (localStorage.getItem("userToken")) {
  window.location.href = "index.html";
}

document.getElementById("loginForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const username = e.target.username.value.trim();
  const password = e.target.password.value.trim();
  const msg = document.getElementById("msg");

  try {
    const res = await fetch("http://localhost:4000/api/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.success && data.token) {
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("username", data.username);
      localStorage.setItem("email", data.email);
      window.location.href = "profile.html";
    } else {
      msg.style.display = "block";
      msg.textContent = data.message || "Invalid username or password";
      msg.style.color = "darkRed";
    }

  } catch (err) {
    console.error(err);
    msg.style.display = "block";
    msg.textContent = "Server error — try again.";
    msg.style.color = "darkRed";
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
