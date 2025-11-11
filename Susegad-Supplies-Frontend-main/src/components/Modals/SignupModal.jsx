import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import './Modal.css';

function SignupModal({ isOpen, onClose, onSwitchToLogin }) {

    if (!isOpen) return null; // ✅ modal stays hidden

    const { showToast, API_URL } = useAppContext();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/shop/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json();

            if (res.ok) {
                showToast('Account created! Please log in.');
                onClose();
                onSwitchToLogin();
            } else {
                setError(data.message || "Signup failed.");
            }
        } catch (err) {
            setError("Could not connect to the server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button onClick={onClose} className="modal-close-btn">×</button>

                <form onSubmit={handleSignup}>
                    <h2>Create Account</h2>

                    <div className="form-group">
                        <label>Your Name</label>
                        <input type="text" value={name}
                               onChange={e => setName(e.target.value)} required />
                    </div>

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
                        {isLoading ? 'Signing Up...' : 'Sign Up'}
                    </button>

                    <p className="form-switcher">
                        Already have an account? <span onClick={onSwitchToLogin}>Login</span>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default SignupModal;
