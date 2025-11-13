document.addEventListener("DOMContentLoaded", () => {

  // Define API based on environment
  const hostname = window.location.hostname;

  const API = (hostname.includes('onrender.com') || hostname === 'susegad-supplies-admin.web.app')
    ? "https://susegad-supplies-backend.onrender.com"
    : "http://localhost:5000";

  const form = document.getElementById("adminLoginForm");
  const emailInput = document.getElementById("email");
  const passInput = document.getElementById("password");
  const errorBox = document.getElementById("error");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.textContent = "";

    const payload = {
      email: emailInput.value.trim(),
      password: passInput.value.trim()
    };

    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        errorBox.textContent = data.message || "Invalid credentials";
        return;
      }

      localStorage.setItem("adminUser", JSON.stringify(data.admin));
      window.location.href = "admin.html";
    } catch (err) {
      console.error("Login error:", err);
      errorBox.textContent = "Server error. Try again.";
    }
  });
});