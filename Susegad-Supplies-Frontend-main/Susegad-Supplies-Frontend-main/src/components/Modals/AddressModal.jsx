import React, { useState, useEffect } from 'react';
import './Modal.css';

function AddressModal({ isOpen, onClose, onSave, address, defaultName }) {
    const [formData, setFormData] = useState({
        fullName: '',
        address: '',
        city: 'Madgaon',
        pincode: '',
        country: 'India' // 🌟 FIX: Default country field
    });

    useEffect(() => {
        if (address) {
            // Use existing address data for editing
            setFormData({ ...address, country: address.country || 'India' }); // Ensure country is initialized
        } else {
            // Reset to default state for adding new address
            setFormData({ 
                fullName: defaultName || '', 
                address: '', 
                city: 'Madgaon', 
                pincode: '',
                country: 'India' // Default for new addresses
            });
        }
    }, [address, defaultName, isOpen]);

    // If the modal is not open, return null immediately
    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault(); 
        
        // Call the parent component's onSave handler
        onSave(formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button onClick={onClose} className="modal-close-btn">×</button>
                <form onSubmit={handleSubmit}>
                    <h2>{address ? 'Edit Address' : 'Add New Address'}</h2>
                    
                    <div className="form-group">
                        <label htmlFor="fullName">Full Name</label>
                        <input type="text" id="fullName" value={formData.fullName} onChange={handleChange} required />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="address">Street Address</label>
                        <input type="text" id="address" value={formData.address} onChange={handleChange} required />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="city">City / Town</label>
                        <input type="text" id="city" value={formData.city} onChange={handleChange} required />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="pincode">Pincode</label>
                        <input type="text" id="pincode" value={formData.pincode} onChange={handleChange} required />
                    </div>

                    {/* 🌟 NEW: Add Country input (required by backend PUT route) 🌟 */}
                    <div className="form-group">
                        <label htmlFor="country">Country</label>
                        <input type="text" id="country" value={formData.country} onChange={handleChange} required />
                    </div>
                    
                    <button type="submit" className="cta-button login-btn">Save Address</button>
                </form>
            </div>
        </div>
    );
}

export default AddressModal;