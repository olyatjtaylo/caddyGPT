import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery, useMutation } from 'react-query';
import Papa from 'papaparse';

const ShotAnalysisDashboard = () => {
  const [shotData, setShotData] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);

  // Load historical shot data
  const { data: historicalShots, isLoading } = useQuery('historicalShots', async () => {
    const response = await window.fs.readFile('shot_history.csv', { encoding: 'utf8' });
    return new Promise((resolve) => {
      Papa.parse(response, {
        header: true,
        dynamicTyping: true,
        complete: (results) => resolve(results.data)
      });
    });
  });

  // Calculate shot statistics and trends
  const shotStats = useMutation(async (data) => {
    const stats = {
      averageDistance: 0,
      dispersion: 0,
      consistencyScore: 0,
      trends: []
    };

    if (data && data.length > 0) {
      // Calculate averages and dispersion
      const distances = data.map(shot => shot.distance);
      stats.averageDistance = distances.reduce((a, b) => a + b) / distances.length;
      stats.dispersion = Math.sqrt(
        distances.reduce((acc, val) => acc + Math.pow(val - stats.averageDistance, 2), 0) / 
        distances.length
      );

      // Calculate consistency score (0-100)
      stats.consistencyScore = Math.max(0, 100 - (stats.dispersion / stats.averageDistance * 100));

      // Generate trend data
      stats.trends = data.map((shot, index) => ({
        shotNumber: index + 1,
        distance: shot.distance,
        average: stats.averageDistance
      }));
    }

    return stats;
  });

  // Effect to calculate stats when historical data changes
  useEffect(() => {
    if (historicalShots && selectedClub) {
      const clubShots = historicalShots.filter(shot => shot.club === selectedClub);
      shotStats.mutate(clubShots);
    }
  }, [historicalShots, selectedClub]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shot Analysis Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatCard
              title="Average Distance"
              value={`${Math.round(shotStats.data?.averageDistance || 0)} yards`}
              trend="+2% from last month"
            />
            <StatCard
              title="Shot Dispersion"
              value={`±${Math.round(shotStats.data?.dispersion || 0)} yards`}
              trend="-1% from last month"
            />
            <StatCard
              title="Consistency Score"
              value={`${Math.round(shotStats.data?.consistencyScore || 0)}/100`}
              trend="+5 points from last month"
            />
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Shot Distance Trends</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={shotStats.data?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="shotNumber" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="distance"
                    stroke="#2563eb"
                    name="Shot Distance"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke="#dc2626"
                    name="Average Distance"
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Club Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ClubPerformanceChart data={historicalShots} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shot Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ShotDistributionChart data={historicalShots} />
              </CardContent>
            </Card>
          </div>

          {shotStats.data?.recommendations && (
            <Alert className="mt-6">
              <AlertDescription>
                {shotStats.data.recommendations}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({ title, value, trend }) => (
  <div className="p-4 bg-white rounded-lg shadow">
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <p className="text-2xl font-bold mt-2">{value}</p>
    <p className={`text-sm ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
      {trend}
    </p>
  </div>
);

const ClubPerformanceChart = ({ data }) => {
  const processedData = data?.reduce((acc, shot) => {
    if (!acc[shot.club]) {
      acc[shot.club] = {
        club: shot.club,
        avgDistance: 0,
        totalShots: 0