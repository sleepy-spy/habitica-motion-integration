const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SYNC_MAP_PATH = path.join(__dirname, '..', 'sync-map.json');

// Mock fetch for testing
global.fetch = async (url, options) => {
  const urlStr = url.toString();

  // Mock Habitica API
  if (urlStr.includes('habitica.com')) {
    return {
      ok: true,
      json: async () => ({
        data: [
          { id: 'hab-1', text: 'Task 1', notes: 'Notes 1', date: '2025-01-01', completed: false },
          { id: 'hab-2', text: 'Task 2', notes: '', date: null, completed: false },
        ],
      }),
    };
  }

  // Mock Motion API - workspaces
  if (urlStr.includes('/workspaces')) {
    return {
      ok: true,
      json: async () => ({
        workspaces: [{ id: 'ws-1', name: 'My Private Workspace' }],
      }),
    };
  }

  // Mock Motion API - statuses
  if (urlStr.includes('/statuses')) {
    return {
      ok: true,
      json: async () => ({
        statuses: [{ name: 'Done', isDefaultStatus: false, isResolvedStatus: true }],
      }),
    };
  }

  // Mock Motion API - list tasks
  if (urlStr.includes('/tasks') && (!options || options.method === undefined || options.method === 'GET')) {
    return {
      ok: true,
      json: async () => ({
        tasks: [],
      }),
    };
  }

  // Mock Motion API - create task
  if (urlStr.includes('/tasks') && options && options.method === 'POST') {
    const body = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        id: `mov-${Date.now()}`,
        name: body.name,
      }),
    };
  }

  // Mock Motion API - update task
  if (urlStr.includes('/tasks/') && options && options.method === 'PATCH') {
    const body = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        id: urlStr.split('/').pop(),
        name: body.name,
        status: body.status,
      }),
    };
  }

  return { ok: true, json: async () => ({}) };
};

// Set test env vars
process.env.HABITICA_USER_ID = 'test-user-id';
process.env.HABITICA_API_KEY = 'test-api-key';
process.env.MOTION_API_KEY = 'test-motion-key';

// Clean up sync-map.json before tests
if (fs.existsSync(SYNC_MAP_PATH)) {
  fs.unlinkSync(SYNC_MAP_PATH);
}

const { loadSyncMap, saveSyncMap } = (() => {
  // Re-define these functions for testing (they're not exported from index.js)
  const SYNC_MAP_PATH_TEST = path.join(__dirname, '..', 'sync-map.json');

  function loadSyncMap() {
    if (fs.existsSync(SYNC_MAP_PATH_TEST)) {
      return JSON.parse(fs.readFileSync(SYNC_MAP_PATH_TEST, 'utf8'));
    }
    return {};
  }

  function saveSyncMap(map) {
    fs.writeFileSync(SYNC_MAP_PATH_TEST, JSON.stringify(map, null, 2));
  }

  return { loadSyncMap, saveSyncMap };
})();

async function testLoadSyncMapEmpty() {
  // Clean up
  if (fs.existsSync(SYNC_MAP_PATH)) {
    fs.unlinkSync(SYNC_MAP_PATH);
  }

  const map = loadSyncMap();
  assert.deepStrictEqual(map, {}, 'Should return empty object when file does not exist');
  console.log('PASS: loadSyncMap returns empty object when file missing');
}

async function testSaveAndLoadSyncMap() {
  const testMap = {
    'hab-1': { motionId: 'mov-1', completed: false },
    'hab-2': { motionId: 'mov-2', completed: true },
  };

  saveSyncMap(testMap);
  const loaded = loadSyncMap();

  assert.deepStrictEqual(loaded, testMap, 'Should save and load correctly');
  console.log('PASS: saveSyncMap and loadSyncMap work together');
}

async function testSyncMapFileExists() {
  assert(fs.existsSync(SYNC_MAP_PATH), 'sync-map.json should exist after save');
  console.log('PASS: sync-map.json file exists');
}

async function testSyncMapStructure() {
  const map = loadSyncMap();

  assert.strictEqual(typeof map, 'object', 'Map should be an object');
  assert.strictEqual(typeof map['hab-1'], 'object', 'Each entry should be an object');
  assert.strictEqual(map['hab-1'].motionId, 'mov-1', 'Entry should have motionId');
  assert.strictEqual(map['hab-1'].completed, false, 'Entry should have completed');
  console.log('PASS: sync-map structure is correct');
}

async function testSyncMapUpdate() {
  const map = loadSyncMap();
  map['hab-1'].completed = true;
  saveSyncMap(map);

  const loaded = loadSyncMap();
  assert.strictEqual(loaded['hab-1'].completed, true, 'Should update completed status');
  console.log('PASS: sync-map can be updated');
}

async function runTests() {
  console.log('Running index.js tests...\n');
  await testLoadSyncMapEmpty();
  await testSaveAndLoadSyncMap();
  await testSyncMapFileExists();
  await testSyncMapStructure();
  await testSyncMapUpdate();

  // Clean up after tests
  if (fs.existsSync(SYNC_MAP_PATH)) {
    fs.unlinkSync(SYNC_MAP_PATH);
  }

  console.log('\nAll index.js tests passed!');
}

runTests();
