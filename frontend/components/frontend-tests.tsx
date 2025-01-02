
import { render, screen } from '@testing-library/react';
import App from '../src/App';

test('renders main app component', () => {
  render(<App />);
  const linkElement = screen.getByText(/welcome/i);
  expect(linkElement).toBeInTheDocument();
});
