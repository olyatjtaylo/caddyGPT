
import React, { useState, useEffect } from 'react';
import './ProfileView.css';

const ProfileView = () => {
    const [clubs, setClubs] = useState([]);
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        async function fetchClubs() {
            const response = await fetch('/api/clubs');
            const data = await response.json();
            setClubs(data);
        }
        fetchClubs();
    }, []);

    const saveChanges = async () => {
        await fetch('/api/clubs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clubs),
        });
        setEditMode(false);
    };

    const handleChange = (index, field, value) => {
        const updatedClubs = [...clubs];
        updatedClubs[index][field] = value;
        setClubs(updatedClubs);
    };

    return (
        <section className="profile-view">
            <div className="club-manager">
                <div className="header-actions">
                    <h2>Club Data</h2>
                    <div>
                        {editMode ? (
                            <button onClick={saveChanges} className="action-btn primary">Save</button>
                        ) : (
                            <button onClick={() => setEditMode(true)} className="action-btn">Edit</button>
                        )}
                    </div>
                </div>
                <table className="club-table">
                    <thead>
                        <tr>
                            <th>Club</th>
                            <th>Distance</th>
                            <th>Left/Right</th>
                            <th>Short/Long</th>
                            <th>Shape</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clubs.map((club, index) => (
                            <tr key={index}>
                                <td>{club.club}</td>
                                <td>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            value={club.distance}
                                            onChange={(e) => handleChange(index, 'distance', e.target.value)}
                                        />
                                    ) : (
                                        club.distance
                                    )}
                                </td>
                                <td>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            value={club.lr}
                                            onChange={(e) => handleChange(index, 'lr', e.target.value)}
                                        />
                                    ) : (
                                        club.lr
                                    )}
                                </td>
                                <td>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            value={club.sl}
                                            onChange={(e) => handleChange(index, 'sl', e.target.value)}
                                        />
                                    ) : (
                                        club.sl
                                    )}
                                </td>
                                <td>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            value={club.shape}
                                            onChange={(e) => handleChange(index, 'shape', e.target.value)}
                                        />
                                    ) : (
                                        club.shape
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default ProfileView;
