
import React, { useState, useEffect } from 'react';

function ProfilePage() {
    const [profile, setProfile] = useState(null);
    const [editing, setEditing] = useState(false);
    const [updatedProfile, setUpdatedProfile] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const response = await fetch('/get_profile');
                if (!response.ok) {
                    throw new Error('Failed to fetch profile');
                }
                const data = await response.json();
                setProfile(data.profile);
                setUpdatedProfile(data.profile); // Pre-fill form with existing data
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUpdatedProfile({ ...updatedProfile, [name]: value });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/update_profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProfile),
            });
            if (!response.ok) {
                throw new Error('Failed to update profile');
            }
            const data = await response.json();
            setProfile(data.profile); // Update profile with the response data
            setEditing(false); // Exit editing mode
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <p>Loading profile...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <h1>Golfer Profile</h1>
            {editing ? (
                <form onSubmit={handleFormSubmit}>
                    {Object.keys(profile).map((key) => (
                        <div key={key}>
                            <label>{key}</label>
                            <input
                                type="text"
                                name={key}
                                value={updatedProfile[key] || ''}
                                onChange={handleInputChange}
                            />
                        </div>
                    ))}
                    <button type="submit">Save</button>
                    <button type="button" onClick={() => setEditing(false)}>
                        Cancel
                    </button>
                </form>
            ) : (
                <div>
                    {Object.entries(profile).map(([key, value]) => (
                        <p key={key}>
                            <strong>{key}:</strong> {value}
                        </p>
                    ))}
                    <button onClick={() => setEditing(true)}>Edit Profile</button>
                </div>
            )}
        </div>
    );
}

export default ProfilePage;
