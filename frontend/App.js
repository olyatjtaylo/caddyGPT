// Frontend JS for dynamic interactions

document.addEventListener('DOMContentLoaded', function () {
    const loadProfileBtn = document.getElementById("load-profile-btn");
    const profileInfoDiv = document.getElementById("profile-info");
    const courseDropdown = document.getElementById("course-dropdown");
    const uploadKMLBtn = document.getElementById("upload-kml-btn");
    const getRecommendationBtn = document.getElementById("get-recommendation-btn");
    const recommendationInfoDiv = document.getElementById("recommendation-info");

    // Fetch and display Golfer Profile
    loadProfileBtn.addEventListener('click', function () {
        const email = "john.doe@example.com";  // Hardcoded for testing; replace with actual logic
        fetch(`http://localhost:5000/get_profile?email=${email}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    profileInfoDiv.innerHTML = `<p>Error: ${data.error}</p>`;
                } else {
                    const golfer = data.golfer;
                    profileInfoDiv.innerHTML = `
                        <p>Name: ${golfer.name}</p>
                        <p>Email: ${golfer.email}</p>
                        <p>Clubs: ${data.clubs.map(club => club.club_name).join(', ')}</p>
                    `;
                }
            });
    });

    // Handle Course Selection (e.g., display selected course details)
    courseDropdown.addEventListener('change', function () {
        const selectedCourse = courseDropdown.value;
        if (selectedCourse) {
            fetch(`http://localhost:5000/get_course_details?course_name=${selectedCourse}`)
                .then(response => response.json())
                .then(data => {
                    // Display course details, e.g., KML data or layout
                    console.log(data);
                    // Optionally render map using Leaflet or CesiumJS based on KML data
                });
        }
    });

    // Handle KML Upload
    uploadKMLBtn.addEventListener('click', function () {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".kml";
        fileInput.onchange = function (event) {
            const file = event.target.files[0];
            const formData = new FormData();
            formData.append("kml_file", file);
            
            fetch('http://localhost:5000/upload_kml', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    // Handle successful upload (e.g., render course map)
                    console.log(data);
                });
        };
        fileInput.click();
    });

    // Handle Shot Recommendation
    getRecommendationBtn.addEventListener('click', function () {
        const targetDistance = parseFloat(document.getElementById("target-distance").value);
        fetch('http://localhost:5000/recommend_shot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                golfer_id: 1,  // Hardcoded for testing; replace with actual logic
                target_distance: targetDistance,
                elevation_change: 10,  // Example
                wind_speed: 5  // Example
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.recommended_club) {
                    recommendationInfoDiv.innerHTML = `
                        <p>Recommended Club: ${data.recommended_club}</p>
                        <p>Carry Distance: ${data.carry_distance}</p>
                        <p>Rollout Distance: ${data.rollout_distance}</p>
                        <p>Dispersion Radius: ${data.dispersion_radius}</p>
                    `;
                } else {
                    recommendationInfoDiv.innerHTML = `<p>No recommendation found</p>`;
                }
            });
    });
});


// Handle My Profile Section

document.addEventListener('DOMContentLoaded', function () {
    const clubDataForm = document.getElementById('club-data-form');
    const clubDataTable = document.getElementById('club-data-table').querySelector('tbody');

    // Function to fetch and render existing club data
    async function fetchClubData() {
        try {
            const response = await fetch('http://localhost:5000/get_clubs'); // Update with actual API endpoint
            const data = await response.json();

            // Clear the table
            clubDataTable.innerHTML = '';

            // Render rows
            data.clubs.forEach(club => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${club.club_name}</td>
                    <td>${club.carry}</td>
                    <td>${club.run}</td>
                    <td>${club.carry + club.run}</td>
                    <td>${club.dispersion}</td>
                    <td>
                        <button class="edit-btn" data-club="${club.club_name}">Edit</button>
                        <button class="delete-btn" data-club="${club.club_name}">Delete</button>
                    </td>
                `;
                clubDataTable.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching club data:', error);
        }
    }

    // Add or update club data
    clubDataForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const formData = new FormData(clubDataForm);
        const clubData = {
            club_name: formData.get('club_name'),
            carry: parseFloat(formData.get('carry_distance')),
            run: parseFloat(formData.get('run_distance')),
            dispersion: parseFloat(formData.get('dispersion_radius')),
        };

        try {
            const response = await fetch('http://localhost:5000/update_club', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clubData),
            });
            const result = await response.json();

            if (result.success) {
                fetchClubData(); // Refresh table
                clubDataForm.reset(); // Clear form
            } else {
                alert('Error updating club data: ' + result.error);
            }
        } catch (error) {
            console.error('Error updating club data:', error);
        }
    });

    // Fetch club data on page load
    fetchClubData();
});


// Handle Course Selection and KML Upload

document.addEventListener('DOMContentLoaded', function () {
    const courseDropdown = document.getElementById('course-dropdown');
    const uploadKMLBtn = document.getElementById('upload-kml-btn');
    const kmlFileInput = document.getElementById('kml-file');

    // Fetch and populate courses in the dropdown
    async function fetchCourses() {
        try {
            const response = await fetch('http://localhost:5000/get_courses'); // Update with actual API endpoint
            const data = await response.json();

            // Clear existing options
            courseDropdown.innerHTML = '<option value="" disabled selected>Select a course</option>';

            // Populate dropdown with courses
            data.courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.name;
                option.textContent = course.name;
                courseDropdown.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    }

    // Handle course selection change
    courseDropdown.addEventListener('change', function () {
        const selectedCourse = courseDropdown.value;
        console.log('Selected Course:', selectedCourse);
        // Additional functionality like fetching course details can be added here
    });

    // Handle KML upload
    uploadKMLBtn.addEventListener('click', async function () {
        const file = kmlFileInput.files[0];
        if (!file) {
            alert('Please select a KML file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('kml_file', file);

        try {
            const response = await fetch('http://localhost:5000/upload_kml', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();

            if (result.success) {
                alert('KML file uploaded successfully!');
                // Optionally, trigger additional actions like rendering a map
            } else {
                alert('Error uploading KML file: ' + result.error);
            }
        } catch (error) {
            console.error('Error uploading KML file:', error);
        }
    });

    // Fetch courses on page load
    fetchCourses();
});
