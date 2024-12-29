// Continue from previous implementation
const ClubPerformanceChart = ({ data }) => {
  // Process club statistics
  const clubStats = React.useMemo(() => {
    return data?.reduce((acc, shot) => {
      if (!acc[shot.club]) {
        acc[shot.club] = {
          club: shot.club,
          totalDistance: 0,
          shots: 0,
          dispersions: []
        };
      }
      
      acc[shot.club].totalDistance += shot.distance;
      acc[shot.club].shots++;
      acc[shot.club].dispersions.push(shot.dispersion);
      
      return acc;
    }, {});
  }, [data]);

  const chartData = Object.values(clubStats || {}).map(stat => ({
    club: stat.club,
    averageDistance: stat.totalDistance / stat.shots,
    dispersion: Math.sqrt(
      stat.dispersions.reduce((acc, val) => acc + Math.pow(val, 2), 0) / stat.shots
    )
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="club" />
          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="averageDistance"
            stroke="#8884d8"
            name="Average Distance"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="dispersion"
            stroke="#82ca9d"
            name="Dispersion"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const ShotDistributionChart = ({ data, selectedClub }) => {
  const distributionData = React.useMemo(() => {
    if (!data || !selectedClub) return [];

    const clubShots = data.filter(shot => shot.club === selectedClub);
    const bucketSize = 5; // 5-yard buckets
    const distribution = {};

    clubShots.forEach(shot => {
      const bucket = Math.floor(shot.distance / bucketSize) * bucketSize;
      distribution[bucket] = (distribution[bucket] || 0) + 1;
    });

    return Object.entries(distribution).map(([distance, count]) => ({
      distance: `${distance}-${parseInt(distance) + bucketSize}`,
      count
    }));
  }, [data, selectedClub]);

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={distributionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="distance" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#8884d8"
            name="Number of Shots"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Data Processing Utilities
const calculateTrends = (shotHistory) => {
  if (!shotHistory?.length) return null;

  const recentShots = shotHistory.slice(-20); // Last 20 shots
  const trends = {
    distanceTrend: 0,
    accuracyTrend: 0,
    consistencyTrend: 0
  };

  // Calculate distance trend
  const distances = recentShots.map(shot => shot.distance);
  const distanceRegression = linearRegression(
    distances.map((_, i) => i),
    distances
  );
  trends.distanceTrend = distanceRegression.slope;

  // Calculate accuracy trend
  const accuracy = recentShots.map(shot => shot.accuracy);
  const accuracyRegression = linearRegression(
    accuracy.map((_, i) => i),
    accuracy
  );
  trends.accuracyTrend = accuracyRegression.slope;

  // Calculate consistency trend
  const consistencyScores = calculateConsistencyScores(recentShots);
  const consistencyRegression = linearRegression(
    consistencyScores.map((_, i) => i),
    consistencyScores
  );
  trends.consistencyTrend = consistencyRegression.slope;

  return trends;
};

const calculateConsistencyScores = (shots) => {
  if (!shots?.length) return [];

  const averageDistance = shots.reduce((acc, shot) => acc + shot.distance, 0) / shots.length;
  
  return shots.map(shot => {
    const distanceVariation = Math.abs(shot.distance - averageDistance);
    return Math.max(0, 100 - (distanceVariation / averageDistance * 100));
  });
};

const linearRegression = (x, y) => {
  const n = x.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

// Weather Impact Analysis Component
const WeatherImpactAnalysis = ({ shotData }) => {
  const [weatherImpact, setWeatherImpact] = useState(null);

  useEffect(() => {
    if (!shotData) return;

    const impact = shotData.reduce((acc, shot) => {
      const conditions = shot.weatherConditions || 'normal';
      if (!acc[conditions]) {
        acc[conditions] = {
          totalDistance: 0,
          count: 0,
          averageDispersion: 0
        };
      }

      acc[conditions].totalDistance += shot.distance;
      acc[conditions].count++;
      acc[conditions].averageDispersion = 
        (acc[conditions].averageDispersion * (acc[conditions].count - 1) + shot.dispersion) / 
        acc[conditions].count;

      return acc;
    }, {});

    setWeatherImpact(impact);
  }, [shotData]);

  if (!weatherImpact) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weather Impact Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(weatherImpact).map(([condition, stats]) => (
            <div key={condition} className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2 capitalize">{condition}</h4>
              <p>Avg Distance: {Math.round(stats.totalDistance / stats.count)} yards</p>
              <p>Avg Dispersion: ±{Math.round(stats.averageDispersion)} yards</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export {
  ShotAnalysisDashboard,
  ClubPerformanceChart,
  ShotDistributionChart,
  WeatherImpactAnalysis,
  calculateTrends,
  calculateConsistencyScores
};