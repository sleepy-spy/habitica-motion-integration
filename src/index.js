require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { fetchTodos } = require('./habitica');
const { getWorkspaceIdByName, createTask, updateTask } = require('./motion');

const SYNC_MAP_PATH = path.join(__dirname, '..', 'sync-map.json');
const WORKSPACE_NAME = 'My Tasks (Private)';

function loadSyncMap() {
  if (fs.existsSync(SYNC_MAP_PATH)) {
    return JSON.parse(fs.readFileSync(SYNC_MAP_PATH, 'utf8'));
  }
  return {};
}

function saveSyncMap(map) {
  fs.writeFileSync(SYNC_MAP_PATH, JSON.stringify(map, null, 2));
}

async function sync() {
  console.log('Starting sync...');

  // 1. Resolve workspace ID
  const workspaceId = await getWorkspaceIdByName(WORKSPACE_NAME);
  const taskCompletion = 'Completed';
  console.log(`Workspace ID: ${workspaceId}`);

  // 2. Fetch incomplete to-dos from Habitica
  const habiticaTodos = await fetchTodos();
  const habiticaIds = new Set(habiticaTodos.map(t => t.id));
  console.log(`Found ${habiticaTodos.length} Habitica to-dos`);

  // 3. Load sync-map
  const syncMap = loadSyncMap();

  // 4. Create or update tasks from Habitica
  for (const todo of habiticaTodos) {
    const entry = syncMap[todo.id];

    if (entry) {
      // Task exists - update it
      await updateTask(entry.motionId, {
        name: todo.text,
        description: todo.notes || '',
        dueDate: todo.date || null,
        workspaceId,
      });
      entry.name = todo.text;
      console.log(`Updated: ${todo.text}`);
    } else {
      // New task - create it
      const created = await createTask({
        name: todo.text,
        description: todo.notes || '',
        dueDate: todo.date || null,
        workspaceId,
      });
      syncMap[todo.id] = {
        motionId: created.id,
        name: todo.text,
        workspaceId,
        completed: false,
      };
      console.log(`Created: ${todo.text}`);
    }
  }

  // 5. Mark tasks complete if they disappeared from Habitica
  for (const [habId, entry] of Object.entries(syncMap)) {
    if (!habiticaIds.has(habId) && !entry.completed) {
      try {
        await updateTask(entry.motionId, {
          name: entry.name,
          workspaceId: entry.workspaceId,
          status: taskCompletion,
        });
        entry.completed = true;
        console.log(`Marked complete: ${habId}`);
      } catch (error) {
        console.error(`Failed to close task ${entry.motionId}:`, error.message);
      }
    }
  }

  // 6. Save sync-map
  saveSyncMap(syncMap);
  console.log('Sync complete!');
}

// Run sync
sync().catch(console.error);
