import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import AddressModal from '../../components/Modals/AddressModal.jsx';
import './ProfilePage.css';

function ProfilePage() { 
    const { user, setUser, API_URL, showToast } = useAppContext();
    const [profileData, setProfileData] = useState(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    const fetchProfile = async () => {
        if (user) {
            try {
                const res = await fetch(`${API_URL}/user/profile/${user.email}`);
                const data = await res.json();
                setProfileData(data);
                setName(data.name);
            } catch (err) {
                showToast("Could not load profile.", "error");
            }
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [user]);

    const handleNameUpdate = async () => {
        try {
            const res = await fetch(`${API_URL}/user/profile`, {
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
        setEditingAddress(address);
        setIsModalOpen(true);
    };

    const handleSaveAddress = async (formData) => {
        try {
            let res;
            if (editingAddress) {
                res = await fetch(`${API_URL}/user/addresses/${editingAddress._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userEmail: user.email, address: formData })
                });
            } else {
                res = await fetch(`${API_URL}/user/addresses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userEmail: user.email, newAddress: formData })
                });
            }

            if (res.ok) {
                showToast("Address saved successfully!");
                setIsModalOpen(false);
                fetchProfile();
            } else {
                showToast("Failed to save address.", "error");
            }
        } catch (err) {
            showToast("An error occurred while saving the address.", "error");
        }
    };
    
    const handleDeleteAddress = async (addressId) => {
        if (window.confirm("Are you sure you want to delete this address?")) {
            try {
                const res = await fetch(`${API_URL}/user/addresses/${addressId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userEmail: user.email })
                });
                if (res.ok) {
                    showToast("Address deleted successfully!");
                    fetchProfile();
                } else {
                    showToast("Failed to delete address.", "error");
                }
            } catch (err) {
                showToast("An error occurred while deleting the address.", "error");
            }
        }
    };

    if (!profileData) return <p className="container">Loading profile...</p>;

    return (
        <>
            <section id="profile-page">
                <div className="container">
                    <h1 className="page-title">My Profile</h1>
                    <div className="profile-section">
                        <h3>Personal Details</h3>
                        <div className="profile-detail-item">
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
                        <div className="profile-detail-item">
                            <label>Email:</label>
                            <span>{profileData.email}</span>
                        </div>
                    </div>

                    <div className="profile-section">
                        <div className="address-header">
                            <h3>Saved Addresses</h3>
                            <button className="cta-button" onClick={() => openAddressModal()}>Add New Address</button>
                        </div>
                        {profileData.addresses && profileData.addresses.length > 0 ? (
                            profileData.addresses.map((addr) => (
                                <div className="address-card" key={addr._id}>
                                    <div>
                                        <p><strong>{addr.fullName}</strong></p>
                                        <p>{addr.address}</p>
                                        <p>{addr.city}, {addr.pincode}</p>
                                    </div>
                                    <div className="address-actions">
                                        <button className="edit-btn" onClick={() => openAddressModal(addr)}>Edit</button>
                                        <button className="delete-btn" onClick={() => handleDeleteAddress(addr._id)}>Delete</button>
                                    </div>
                                </div>
                            ))
                        ) : ( <p>You have no saved addresses. Click "Add New Address" to get started.</p> )}
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