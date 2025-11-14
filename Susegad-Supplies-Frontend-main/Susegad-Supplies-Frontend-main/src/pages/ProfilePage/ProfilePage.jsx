import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import AddressModal from '../../components/Modals/AddressModal.jsx';
import './ProfilePage.css';

function ProfilePage() {
    // Destructure new address handlers from context
    const { user, setUser, API_URL, showToast, saveAddress, deleteAddress, updateAddress } = useAppContext();
    
    const [profileData, setProfileData] = useState(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    // Fetch User Profile and Addresses
    const fetchProfile = async () => {
        if (user?.email) {
            try {
                const res = await fetch(`${API_URL}/shop/user/address/${user.email}`); 
                const data = await res.json();
                
                const savedAddresses = data.addresses || [];

                setProfileData({
                    ...user,
                    addresses: Array.isArray(savedAddresses) ? savedAddresses : [], 
                    email: user.email,
                    name: user.name || user.email.split('@')[0],
                });
                setName(user.name || user.email.split('@')[0]);
            } catch (err) {
                console.error("Error loading profile:", err);
                showToast("Could not load profile or address.", "error");
            }
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [user, API_URL]);

    const handleNameUpdate = async () => {
        try {
            const res = await fetch(`${API_URL}/shop/user/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: user.email, newName: name })
            });
            if (res.ok) {
                showToast("Name updated successfully!");
                const updatedUser = { ...user, name: name };
                setUser(updatedUser);
                localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
                setIsEditingName(false);
                fetchProfile();
            } else {
                showToast("Failed to update name.", "error");
            }
        } catch (err) {
            showToast("An error occurred.", "error");
        }
    };

    const openAddressModal = (address = null) => {
        // 🛑 FIX: Ensure the address ID is converted to a string before setting state
        if (address && address._id) {
            address = { ...address, _id: String(address._id) };
        }
        setEditingAddress(address);
        setIsModalOpen(true);
    };

    // 🛑 FIX: Use context handler for saving/updating address
    const handleSaveAddress = async (formData) => {
        // NOTE: The formData must include the country field for the PUT request to succeed.
        const result = editingAddress
            ? await updateAddress({ country: 'India', ...editingAddress, ...formData })
            : await saveAddress({ country: 'India', ...formData }); 
            
        if (result) {
            setIsModalOpen(false);
            fetchProfile(); // Re-fetch data to update UI
        }
    };

    const handleDeleteAddress = async (addressId) => {
        // 🛑 CRITICAL FIX: Use the deleteAddress function from context
        if (window.confirm("Are you sure you want to delete this address?")) {
            const success = await deleteAddress(String(addressId));
            if (success) {
                fetchProfile(); // Re-fetch data to update UI
            }
        }
    };

    if (!profileData) return <p className="container">Loading profile...</p>;

    // Ensure addresses array is available before mapping
    const userAddresses = profileData.addresses || [];

    return (
        <>
            <section id="profile-page">
                <div className="container">
                    <h1 className="page-title">My Profile</h1>
                    <div className="profile-section">
                        <h3>Personal Details</h3>
                        <div className="profile-detail-item" key="profile-name-edit">
                            <label>Name:</label>
                            {isEditingName ? (
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                            ) : (
                                <span>{profileData.name}</span>
                            )}
                            {isEditingName ? (
                                <div>
                                    <button className="cta-button" onClick={handleNameUpdate}>Save</button>
                                    <button className="edit-btn" onClick={() => setIsEditingName(false)}>Cancel</button>
                                </div>
                            ) : (
                                <button className="edit-btn" onClick={() => setIsEditingName(true)}>Edit</button>
                            )}
                        </div>
                        <div className="profile-detail-item" key="profile-email-display">
                            <label>Email:</label>
                            <span>{profileData.email}</span>
                        </div>
                    </div>

                    <div className="profile-section">
                        <div className="address-header">
                            <h3>Saved Addresses</h3>
                            <button className="cta-button" onClick={() => openAddressModal()}>Add New Address</button>
                        </div>
                        {userAddresses.length > 0 ? (
                            userAddresses.map((addr, index) => (
                                <div className="address-card" key={addr._id || index}>
                                    <div>
                                        <p><strong>{addr.fullName}</strong></p>
                                        <p>{addr.street}</p>
                                        <p>{addr.city}, {addr.pincode}</p>
                                    </div>
                                    <div className="address-actions">
                                        <button className="edit-btn" onClick={() => openAddressModal(addr)}>Edit</button> 
                                        <button className="delete-btn" onClick={() => handleDeleteAddress(addr._id)}>Delete</button>
                                    </div>
                                </div>
                            ))
                        ) : (<p>You have no saved addresses. Click "Add New Address" to get started.</p>)}
                    </div>
                </div>
            </section>

            <AddressModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveAddress}
                address={editingAddress}
                defaultName={user?.name}
            />
        </>
    );
}

export default ProfilePage;