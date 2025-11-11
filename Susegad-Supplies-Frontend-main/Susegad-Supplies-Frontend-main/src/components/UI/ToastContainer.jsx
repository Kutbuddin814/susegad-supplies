import React, { useState, useEffect } from 'react';

function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handleShowToast = (e) => {
            const { message, type } = e.detail;
            const id = Date.now();
            setToasts(prev => [...prev, { id, message, type }]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 3500);
        };
        
        window.addEventListener('showtoast', handleShowToast);
        
        return () => window.removeEventListener('showtoast', handleShowToast);
    }, []);

    return (
        <div id="toast-container">
            {toasts.map(toast => (
                <div key={toast.id} className={`toast show ${toast.type}`}>
                    {toast.message}
                </div>
            ))}
        </div>
    );
}

export default ToastContainer;