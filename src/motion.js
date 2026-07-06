require('dotenv').config();

const MOTION_BASE_URL = 'https://api.usemotion.com/v1';

function getHeaders() {
  return {
    'X-API-Key': process.env.MOTION_API_KEY,
    'Content-Type': 'application/json',
  };
}

async function getWorkspaceIdByName(name) {
  const response = await fetch(`${MOTION_BASE_URL}/workspaces`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Motion API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const workspace = json.workspaces.find(w => w.name === name);

  if (!workspace) {
    throw new Error(`Workspace "${name}" not found`);
  }

  return workspace.id;
}

async function createTask({ name, description, dueDate, workspaceId }) {
  const response = await fetch(`${MOTION_BASE_URL}/tasks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      name,
      description,
      dueDate,
      workspaceId,
      priority: 'MEDIUM',
      duration: 60,
    }),
  });

  if (!response.ok) {
    throw new Error(`Motion API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function updateTask(motionId, fields) {
  const response = await fetch(`${MOTION_BASE_URL}/tasks/${motionId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(fields),
  });

  if (!response.ok) {
    throw new Error(`Motion API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

module.exports = { getWorkspaceIdByName, createTask, updateTask };
