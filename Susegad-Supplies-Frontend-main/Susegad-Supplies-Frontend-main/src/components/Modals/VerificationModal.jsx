import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import './Modal.css';

function VerificationModal({ isOpen, onClose, emailToVerify, onSuccess }) {
    const { showToast, API_URL } = useAppContext();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!code || !/^\d{6}$/.test(code)) { // Basic check for 6 digits
            setError("Please enter the 6-digit code.");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/verify-email-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailToVerify, code: code })
            });
            const data = await res.json();

            if (res.ok) {
                showToast(data.message || 'Email verified successfully! Please log in.', 'success');
                onSuccess(); // Call the success handler (opens login modal)
            } else {
                setError(data.message || "Verification failed.");
            }
        } catch (err) {
            setError("Could not connect to the server.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button onClick={onClose} className="modal-close-btn">×</button>
                <form onSubmit={handleVerify}>
                    <h2>Verify Your Email</h2>
                    <p style={{marginBottom: '20px'}}>Enter the 6-digit code sent to <strong>{emailToVerify}</strong>.</p>
                    <div className="form-group">
                        <label>Verification Code</label>
                        <input
                            type="text" // Use text for easier input on mobile
                            inputMode="numeric" // Hint for numeric keyboard
                            pattern="\d{6}" // HTML5 pattern validation
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            maxLength="6"
                            required
                            style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.5em' }} // Style for code input
                        />
                    </div>
                    <p className="error-message" style={{ display: error ? 'block' : 'none' }}>{error}</p>
                    <button type="submit" className="cta-button login-btn" disabled={isLoading}>
                        {isLoading ? 'Verifying...' : 'Verify Email'}
                    </button>
                    {/* Optional: Add a resend code button here later */}
                </form>
            </div>
        </div>
    );
}

export default VerificationModal;