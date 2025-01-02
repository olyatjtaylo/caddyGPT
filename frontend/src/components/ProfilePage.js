
import React, { useState, useEffect } from 'react';

const defaultClubData = [
    { club: 'Driver', carry: 260, run: 30, total: 290, left: 20, right: 30, long: 15, short: 10, shape: 'R' },
    { club: '3 Wood', carry: 240, run: 25, total: 265, left: 15, right: 25, long: 10, short: 15, shape: 'R' },
    { club: '5 Wood', carry: 220, run: 20, total: 240, left: 12, right: 20, long: 12, short: 18, shape: 'R' },
    { club: '4 Iron', carry: 200, run: 20, total: 220, left: 10, right: 15, long: 10, short: 20, shape: 'N' },
    { club: '5 Iron', carry: 190, run: 15, total: 205, left: 10, right: 15, long: 10, short: 20, shape: 'N' },
    { club: '6 Iron', carry: 180, run: 12, total: 192, left: 8, right: 12, long: 8, short: 15, shape: 'N' },
    { club: '7 Iron', carry: 170, run: 10, total: 180, left: 8, right: 12, long: 8, short: 15, shape: 'N' },
    { club: '8 Iron', carry: 160, run: 8, total: 168, left: 5, right: 8, long: 5, short: 10, shape: 'N' },
    { club: '9 Iron', carry: 150, run: 6, total: 156, left: 5, right: 8, long: 5, short: 10, shape: 'N' },
    { club: 'PW', carry: 140, run: 5, total: 145, left: 5, right: 8, long: 5, short: 10, shape: 'N' },
];

function ProfilePage() {
    const [isEditMode, setEditMode] = useState(false);
    const [clubs, setClubs] = useState([]);

    useEffect(() => {
        const savedData = localStorage.getItem('clubData');
        const clubData = savedData ? JSON.parse(savedData) : defaultClubData;
        setClubs(clubData);
    }, []);

    const toggleEditMode = () => {
        setEditMode(!isEditMode);
        if (!isEditMode) {
            localStorage.setItem('clubData', JSON.stringify(clubs));
        }
    };

    const handleInputChange = (index, field, value) => {
        const updatedClubs = [...clubs];
        updatedClubs[index][field] = value;
        updatedClubs[index].total =
            parseFloat(updatedClubs[index].carry || 0) + parseFloat(updatedClubs[index].run || 0);
        setClubs(updatedClubs);
    };

    return (
        <div>
            <h2>Club Profile</h2>
            <button onClick={toggleEditMode}>
                {isEditMode ? 'Save' : 'Edit'}
            </button>
            <table>
                <thead>
                    <tr>
                        <th>Club</th>
                        <th>Carry</th>
                        <th>Run</th>
                        <th>Total</th>
                        <th>Miss Left (%)</th>
                        <th>Miss Right (%)</th>
                        <th>Miss Long (%)</th>
                        <th>Miss Short (%)</th>
                        <th>Shot Shape</th>
                    </tr>
                </thead>
                <tbody>
                    {clubs.map((club, index) => (
                        <tr key={index}>
                            <td>{club.club}</td>
                            {['carry', 'run', 'total', 'left', 'right', 'long', 'short', 'shape'].map((field) => (
                                <td key={field}>
                                    {isEditMode && field !== 'total' ? (
                                        <input
                                            type="text"
                                            value={club[field]}
                                            onChange={(e) => handleInputChange(index, field, e.target.value)}
                                        />
                                    ) : (
                                        club[field]
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ProfilePage;
