jest.mock('uuid', () => ({
  v7: jest.fn(
    () => `test-uuid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  ),
}));
