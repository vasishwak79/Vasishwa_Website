if (localStorage.getItem("userToken")) {
  window.location.href = "index.html";
}

document.getElementById("signupForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = e.target.username.value.trim();
  const email = e.target.email.value.trim();
  const password = e.target.password.value.trim();
  const msg = document.getElementById("msg");

  try {
    const res = await fetch("http://localhost:4000/api/user/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (data.success) {
      msg.textContent = "Account created! Redirecting...";
      msg.style.color = "black";
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);
    } else {
      msg.textContent = data.message || "Signup failed.";
      msg.style.color = "darkRed";
    }

  } catch (err) {
    console.error(err);
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
