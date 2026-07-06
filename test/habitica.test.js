const assert = require('assert');

// Mock fetch for testing
global.fetch = async (url, options) => {
  return {
    ok: true,
    json: async () => ({
      data: [
        { id: '1', text: 'Test Task 1', notes: 'Notes 1', date: '2025-01-01', completed: false },
        { id: '2', text: 'Test Task 2', notes: 'Notes 2', date: null, completed: false },
      ],
    }),
  };
};

// Set test env vars
process.env.HABITICA_USER_ID = 'test-user-id';
process.env.HABITICA_API_KEY = 'test-api-key';

const { fetchTodos } = require('../src/habitica');

async function testFetchTodos() {
  const todos = await fetchTodos();

  assert(Array.isArray(todos), 'Should return an array');
  assert.strictEqual(todos.length, 2, 'Should return 2 tasks');
  assert.strictEqual(todos[0].text, 'Test Task 1', 'First task should have correct text');
  assert.strictEqual(todos[1].notes, 'Notes 2', 'Second task should have correct notes');
  console.log('PASS: fetchTodos returns correct data');
}

async function testFetchTodosError() {
  // Mock error response
  global.fetch = async () => ({
    ok: false,
    status: 401,
    statusText: 'Unauthorized',
  });

  try {
    await fetchTodos();
    assert.fail('Should throw error');
  } catch (error) {
    assert(error.message.includes('401'), 'Error should include status code');
    console.log('PASS: fetchTodos throws error on API failure');
  }

  // Reset fetch for other tests
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ data: [] }),
  });
}

async function runTests() {
  console.log('Running habitica.js tests...\n');
  await testFetchTodos();
  await testFetchTodosError();
  console.log('\nAll habitica.js tests passed!');
}

runTests();
