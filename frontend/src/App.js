
import React, { useState } from 'react';
import ProfilePage from './components/ProfilePage';
import CourseMap from './components/CourseMap';

function App() {
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div>
            <nav>
                <button onClick={() => setActiveTab('profile')}>Profile</button>
                <button onClick={() => setActiveTab('courses')}>Courses</button>
            </nav>
            {activeTab === 'profile' && <ProfilePage />}
            {activeTab === 'courses' && <CourseMap />}
        </div>
    );
}

export default App;
