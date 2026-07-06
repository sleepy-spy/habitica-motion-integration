const assert = require('assert');

// Mock fetch for testing
global.fetch = async (url, options) => {
  return {
    ok: true,
    json: async () => ({
      workspaces: [
        { id: 'ws-1', name: 'My Private Workspace', statuses: [{ id: 'st-1', name: 'Done', isResolvedStatus: true }, { id: 'st-2', name: 'In Progress', isResolvedStatus: false }] },
        { id: 'ws-2', name: 'Team Workspace', statuses: [{ id: 'st-3', name: 'Completed', isResolvedStatus: true }] },
      ],
    }),
  };
};

// Set test env vars
process.env.MOTION_API_KEY = 'test-api-key';

const { getWorkspaces, getWorkspaceIdByName, getResolvedStatus, listTasks, createTask, updateTask } = require('../src/motion');

async function testGetWorkspaces() {
  const workspaces = await getWorkspaces();

  assert(Array.isArray(workspaces), 'Should return an array');
  assert.strictEqual(workspaces.length, 2, 'Should return 2 workspaces');
  assert.strictEqual(workspaces[0].name, 'My Private Workspace', 'First workspace name');
  console.log('PASS: getWorkspaces returns correct data');
}

async function testGetWorkspaceIdByName() {
  const id = await getWorkspaceIdByName('My Private Workspace');

  assert.strictEqual(id, 'ws-1', 'Should return correct workspace ID');
  console.log('PASS: getWorkspaceIdByName finds correct workspace');
}

async function testGetWorkspaceIdByNameNotFound() {
  try {
    await getWorkspaceIdByName('Nonexistent Workspace');
    assert.fail('Should throw error');
  } catch (error) {
    assert(error.message.includes('not found'), 'Error should say not found');
    console.log('PASS: getWorkspaceIdByName throws error for missing workspace');
  }
}

async function testGetResolvedStatus() {
  const status = await getResolvedStatus('ws-1');
  assert.strictEqual(status, 'Done', 'Should return the resolved status name');
  console.log('PASS: getResolvedStatus returns correct status');
}

async function testGetResolvedStatusNotFound() {
  try {
    await getResolvedStatus('ws-nonexistent');
    assert.fail('Should throw error');
  } catch (error) {
    assert(error.message.includes('not found'), 'Error should say not found');
    console.log('PASS: getResolvedStatus throws error for missing workspace');
  }
}

async function testListTasks() {
  // Mock tasks response
  global.fetch = async (url, options) => {
    return {
      ok: true,
      json: async () => ({
        tasks: [
          { id: 'task-1', name: 'Motion Task 1' },
          { id: 'task-2', name: 'Motion Task 2' },
        ],
      }),
    };
  };

  const tasks = await listTasks('ws-1');

  assert(Array.isArray(tasks), 'Should return an array');
  assert.strictEqual(tasks.length, 2, 'Should return 2 tasks');
  console.log('PASS: listTasks returns correct data');

  // Reset fetch
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ workspaces: [] }),
  });
}

async function testCreateTask() {
  // Mock create response
  global.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        id: 'new-task-id',
        name: body.name,
        priority: body.priority,
      }),
    };
  };

  const task = await createTask({
    name: 'New Task',
    description: 'Description',
    dueDate: '2025-01-01',
    workspaceId: 'ws-1',
  });

  assert.strictEqual(task.id, 'new-task-id', 'Should return new task ID');
  assert.strictEqual(task.name, 'New Task', 'Should have correct name');
  assert.strictEqual(task.priority, 'MEDIUM', 'Should have MEDIUM priority');
  console.log('PASS: createTask creates task correctly');

  // Reset fetch
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ workspaces: [] }),
  });
}

async function testUpdateTask() {
  // Mock update response
  global.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        id: 'task-1',
        name: body.name,
        status: body.status,
      }),
    };
  };

  const task = await updateTask('task-1', {
    name: 'Updated Task',
    status: 'Done',
    workspaceId: 'ws-1',
  });

  assert.strictEqual(task.id, 'task-1', 'Should return task ID');
  assert.strictEqual(task.status, 'Done', 'Should have Done status');
  console.log('PASS: updateTask updates task correctly');

  // Reset fetch
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ workspaces: [] }),
  });
}

async function testUpdateTaskError() {
  // Mock error response
  global.fetch = async () => ({
    ok: false,
    status: 404,
    statusText: 'Not Found',
    text: async () => '{"message":"Not Found"}',
  });

  try {
    await updateTask('task-1', { name: 'Test', workspaceId: 'ws-1' });
    assert.fail('Should throw error');
  } catch (error) {
    assert(error.message.includes('404'), 'Error should include status code');
    console.log('PASS: updateTask throws error on API failure');
  }

  // Reset fetch
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ workspaces: [] }),
  });
}

async function runTests() {
  console.log('Running motion.js tests...\n');
  await testGetWorkspaces();
  await testGetWorkspaceIdByName();
  await testGetWorkspaceIdByNameNotFound();
  await testGetResolvedStatus();
  await testGetResolvedStatusNotFound();
  await testListTasks();
  await testCreateTask();
  await testUpdateTask();
  await testUpdateTaskError();
  console.log('\nAll motion.js tests passed!');
}

runTests();
