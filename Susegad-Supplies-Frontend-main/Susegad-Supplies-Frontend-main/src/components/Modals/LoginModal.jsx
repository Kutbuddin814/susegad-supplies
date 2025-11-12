import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import './Modal.css';

function LoginModal({ isOpen, onClose, onSwitchToSignup }) {

    if (!isOpen) return null; // ✅ modal stays hidden

    const { setUser, showToast, API_URL } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            // API_URL is now correctly set to http://localhost:5000
            const res = await fetch(`${API_URL}/shop/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                showToast('Login successful!');
                setUser(data.user);
                onClose();
            } else {
                setError(data.message || "Login failed.");
            }
        } catch (err) {
            // This error handler should now successfully catch connection issues to localhost:5000
            setError("Could not connect to the server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button onClick={onClose} className="modal-close-btn">×</button>

                <form onSubmit={handleLogin}>
                    <h2>Welcome Back!</h2>

                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={email}
                               onChange={e => setEmail(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={password}
                               onChange={e => setPassword(e.target.value)} required />
                    </div>

                    <p className="error-message">{error}</p>

                    <button type="submit" className="cta-button login-btn" disabled={isLoading}>
                        {isLoading ? 'Logging In...' : 'Login'}
                    </button>

                    <p className="form-switcher">
                        Don't have an account? <span onClick={onSwitchToSignup}>Sign Up</span>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default LoginModal;