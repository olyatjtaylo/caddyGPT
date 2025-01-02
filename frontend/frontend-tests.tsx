import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../context/AuthContext';
import { LoginForm } from '../components/LoginForm';
import { ShotRecommendationForm } from '../components/ShotRecommendationForm';
import { ProfilePage } from '../components/ProfilePage';

// Setup test utils
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          {component}
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// Mock API calls
jest.mock('../api/api', () => ({
  login: jest.fn(),
  getProfile: jest.fn(),
  recommendShot: jest.fn(),
}));

// LoginForm Tests
describe('LoginForm', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders login form', () => {
    renderWithProviders(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    const mockLogin = jest.fn().mockResolvedValue({
      token: 'test-token',
      user: { id: 1, email: 'test@example.com' }
    });

    renderWithProviders(<LoginForm login={mockLogin} />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  test('displays error message on failed login', async () => {
    const mockLogin = jest.fn().mockRejectedValue(new Error('Invalid credentials'));

    renderWithProviders(<LoginForm login={mockLogin} />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});

// ShotRecommendationForm Tests
describe('ShotRecommendationForm', () => {
  test('renders shot recommendation form', () => {
    renderWithProviders(<ShotRecommendationForm />);
    
    expect(screen.getByLabelText(/target distance/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/elevation change/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/wind speed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get recommendation/i })).toBeInTheDocument();
  });

  test('submits form with correct data', async () => {
    const mockRecommendShot = jest.fn().mockResolvedValue({
      recommended_club: '7 Iron',
      carry_distance: 150,
      total_distance: 160
    });

    renderWithProviders(<ShotRecommendationForm recommendShot={mockRecommendShot} />);

    await userEvent.type(screen.getByLabelText(/target distance/i), '150');
    await userEvent.type(screen.getByLabelText(/elevation change/i), '5');
    await userEvent.type(screen.getByLabelText(/wind speed/i), '10');
    
    fireEvent.click(screen.getByRole('button', { name: /get recommendation/i }));

    await waitFor(() => {
      expect(mockRecommendShot).toHaveBeenCalledWith({
        target_distance: 150,
        elevation_change: 5,
        wind_speed: 10
      });
    });
  });

  test('displays loading state during submission', async () => {
    const mockRecommendShot = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );

    renderWithProviders(<ShotRecommendationForm recommendShot={mockRecommendShot} />);

    fireEvent.click(screen.getByRole('button', { name: /get recommendation/i }));

    expect(screen.getByText(/calculating/i)).toBeInTheDocument();
  });
});

// ProfilePage Tests
describe('ProfilePage', () => {
  const mockProfile = {
    name: 'Test Golfer',
    email: 'test@example.com',
    handicap: 15,
    clubs: [
      { club_name: 'Driver', carry_distance: 250, rollout_distance: 20 },
      { club_name: '7 Iron', carry_distance: 150, rollout_distance: 5 }
    ]
  };

  test('renders profile information', async () => {
    const mockGetProfile = jest.fn().mockResolvedValue(mockProfile);

    renderWithProviders(<ProfilePage getProfile={mockGetProfile} />);

    await waitFor(() => {
      expect(screen.getByText(mockProfile.name)).toBeInTheDocument();
      expect(screen.getByText(mockProfile.email)).toBeInTheDocument();
      expect(screen.getByText(`Handicap: ${mockProfile.handicap}`)).toBeInTheDocument();
    });
  });

  test('handles club updates', async () => {
    const mockUpdateClub = jest.fn().mockResolvedValue({ success: true });

    renderWithProviders(<ProfilePage 
      getProfile={jest.fn().mockResolvedValue(mockProfile)}
      updateClub={mockUpdateClub}
    />);

    // Find and click edit button for Driver
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /edit driver/i }));
    });

    // Update carry distance
    const carryInput = screen.getByLabelText(/carry distance/i);
    await userEvent.clear(carryInput);
    await userEvent.type(carryInput, '260');

    // Submit update
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockUpdateClub).toHaveBeenCalledWith({
        club_name: 'Driver',
        carry_distance: 260,