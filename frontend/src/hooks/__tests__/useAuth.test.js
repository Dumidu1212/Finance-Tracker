import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '../useAuth';
import axios from 'axios';

jest.mock('axios');

describe('useAuth Hook', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('logs in successfully and stores token', async () => {
    const mockToken = 'test-token';
    const mockUser = { email: 'test@example.com' };
    axios.post.mockResolvedValue({ data: { token: mockToken, user: mockUser } });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password' });
    });

    expect(localStorage.getItem('token')).toBe(mockToken);
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
  });

  it('handles login errors', async () => {
    axios.post.mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({ email: 'wrong@example.com', password: 'wrongpassword' });
    });

    expect(result.current.error).toBe('Invalid credentials');
  });

  it('logs out and removes token', () => {
    localStorage.setItem('token', 'test-token');

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.logout();
    });

    expect(localStorage.getItem('token')).toBeNull();
  });
});
