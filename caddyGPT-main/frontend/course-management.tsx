import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, Camera } from 'lucide-react';

// Course Dashboard Component
const CourseDashboard = () => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const queryClient = useQueryClient();

  const { data: courses, isLoading: coursesLoading } = useQuery(
    'courses',
    async () => {
      const response = await window.fs.readFile('courses.json', { encoding: 'utf8' });
      return JSON.parse(response);
    }
  );

  const uploadKml = useMutation(
    async (file) => {
      const formData = new FormData();
      formData.append('kml_file', file);
      const response = await fetch('/api/upload_kml', {
        method: 'POST',
        body: formData
      });
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('courses');
      }
    }
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CourseList 
          courses={courses} 
          isLoading={coursesLoading}
          onSelectCourse={setSelectedCourse}
          selectedCourse={selectedCourse}
        />
        <CourseDetails course={selectedCourse} />
      </div>
      
      <div className="mt-8">
        <KMLUploader onUpload={uploadKml.mutate} isLoading={uploadKml.isLoading} />
      </div>
    </div>
  );
};

// Course List Component
const CourseList = ({ courses, isLoading, onSelectCourse, selectedCourse }) => {
  if (isLoading) {
    return <div className="p-4 bg-white rounded-lg shadow">Loading courses...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Golf Courses</h2>
      </div>
      <div className="divide-y">
        {courses?.map(course => (
          <div
            key={course.id}
            className={`p-4 cursor-pointer transition-colors ${
              selectedCourse?.id === course.id 
                ? 'bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelectCourse(course)}
          >
            <h3 className="font-medium">{course.name}</h3>
            <p className="text-sm text-gray-500">{course.location}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Course Details Component with Stats
const CourseDetails = ({ course }) => {
  const { data: stats, isLoading } = useQuery(
    ['courseStats', course?.id],
    async () => {
      if (!course?.id) return null;
      const response = await fetch(`/api/course/${course.id}/stats`);
      return response.json();
    },
    { enabled: !!course?.id }
  );

  if (!course) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Select a course to view details</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p>Loading course details...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">{course.name}</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatsCard 
            title="Total Holes"
            value={stats?.totalHoles || 18}
            icon={<Camera className="w-6 h-6" />}
          />
          <StatsCard 
            title="Total Length"
            value={`${stats?.totalYards || 0} yards`}
            icon={<Camera className="w-6 h-6" />}
          />
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Hole Difficulty</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.holeStats || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hole" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="par" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }}
              />
              <Line 
                type="monotone" 
                dataKey="avgScore" 
                stroke="#82ca9d" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Course Features</h3>
          <div className="grid grid-cols-2 gap-4">
            {course.features?.map(feature => (
              <div 
                key={feature.name}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <p className="font-medium">{feature.name}</p>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// KML Uploader Component
const KMLUploader = ({ onUpload, isLoading }) => {
  const handleFileChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  }, [onUpload]);

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Upload Course Data</h3>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <div className="flex flex-col items-center">
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">
            Drop your KML file here or click to upload
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Supports .kml files exported from Google Earth
          </p>
          <input
            type="file"
            accept=".kml"
            onChange={handleFileChange}
            className="hidden"
            id="kml-upload"
          />
          <label
            htmlFor="kml-upload"
            className={`px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
          >
            {isLoading ? 'Uploading...' : 'Select File'}
          </label>
        </div>
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon }) => (
  <div className="p-4 bg-gray-50 rounded-lg">
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-sm font-medium text-gray-500">{title}</h4>
      {icon}
    </div>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

export default CourseDashboard;