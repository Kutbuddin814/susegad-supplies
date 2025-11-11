document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.style.display = 'none';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // --- ⬇️ CORRECTED API URL ⬇️ ---
            const response = await fetch('https://susegad-supplies.onrender.com/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                 });

            const data = await response.json();

            if (response.ok) {
                // On successful admin login, save user details to localStorage
                localStorage.setItem('loggedInUser', JSON.stringify(data.user));
                // Redirect to the main admin dashboard
                window.location.href = 'admin.html';
            } else {
                errorMessage.textContent = data.message;
                errorMessage.style.display = 'block';
            }
        } catch (err) {
            errorMessage.textContent = 'Failed to connect to the server.';
            errorMessage.style.display = 'block';
        }
    });
});