import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';

// API Service
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handling interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Shot Recommendation Component with Error Handling and Loading States
export const ShotRecommendationForm = () => {
  const [formData, setFormData] = useState({
    target_distance: '',
    elevation_change: '0',
    wind_speed: '0',
    wind_direction: '0'
  });
  
  const shotRecommendation = useMutation(
    (data) => api.post('/recommend_shot', data),
    {
      onError: (error) => {
        console.error('Shot recommendation error:', error);
      }
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    shotRecommendation.mutate(formData);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Shot Recommendation</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Target Distance (yards)
          </label>
          <input
            type="number"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            value={formData.target_distance}
            onChange={(e) => setFormData({
              ...formData,
              target_distance: e.target.value
            })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Elevation Change (feet)
          </label>
          <input
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            value={formData.elevation_change}
            onChange={(e) => setFormData({
              ...formData,
              elevation_change: e.target.value
            })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Wind Speed (mph)
          </label>
          <input
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            value={formData.wind_speed}
            onChange={(e) => setFormData({
              ...formData,
              wind_speed: e.target.value
            })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Wind Direction (degrees)
          </label>
          <input
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            value={formData.wind_direction}
            onChange={(e) => setFormData({
              ...formData,
              wind_direction: e.target.value
            })}
          />
        </div>

        <button
          type="submit"
          disabled={shotRecommendation.isLoading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${shotRecommendation.isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {shotRecommendation.isLoading ? 'Calculating...' : 'Get Recommendation'}
        </button>
      </form>

      {shotRecommendation.isError && (
        <div className="mt-4