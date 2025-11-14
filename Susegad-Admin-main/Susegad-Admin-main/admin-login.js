document.addEventListener("DOMContentLoaded", () => {

    // Define the live API URL of your Render backend
    const RENDER_API_URL = "https://susegad-supplies-04xz.onrender.com";

    // Define the live hostname of your Vercel Admin page
    const VERCEL_ADMIN_HOST = "https://susegad-supplies-pdtj.vercel.app/";

    const hostname = window.location.hostname;

    // 🛑 CORRECTED API BASE URL LOGIC
    // Use the live Render URL if the Admin page is deployed on Vercel
    // or if the URL includes 'onrender.com' (e.g., if you test the admin page through Render)
    const API = (hostname === 'localhost' || hostname === '127.0.0.1')
        ? "http://localhost:5000" // ⬅️ Local Development
        : RENDER_API_URL;         // ⬅️ Deployed (Vercel or Render)

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
            // Use the determined API base URL
            const res = await fetch(`${API}/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // 💡 CRITICAL: Include credentials if your backend uses session/cookies for authentication
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                // If the server returns a non-200 status (e.g., 401, 400)
                errorBox.textContent = data.message || "Invalid credentials";
                return;
            }

            // Successful login
            localStorage.setItem("adminUser", JSON.stringify(data.admin));
            window.location.href = "admin.html";
        } catch (err) {
            console.error("Login error:", err);
            errorBox.textContent = "Server error. Try again.";
        }
    });
});