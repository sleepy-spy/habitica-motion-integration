require('dotenv').config();

const MOTION_BASE_URL = 'https://api.usemotion.com/v1';

function getHeaders() {
  return {
    'X-API-Key': process.env.MOTION_API_KEY,
    'Content-Type': 'application/json',
  };
}

async function getWorkspaces() {
  const response = await fetch(`${MOTION_BASE_URL}/workspaces`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Motion API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return json.workspaces;
}

async function getWorkspaceIdByName(name) {
  const workspaces = await getWorkspaces();
  const workspace = workspaces.find(w => w.name === name);

  if (!workspace) {
    throw new Error(`Workspace "${name}" not found. Available workspaces: ${workspaces.map(w => w.name).join(', ')}`);
  }

  return workspace.id;
}

async function listTasks(workspaceId) {
  const url = workspaceId
    ? `${MOTION_BASE_URL}/tasks?workspaceId=${workspaceId}`
    : `${MOTION_BASE_URL}/tasks`;

  const response = await fetch(url, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Motion API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return json.tasks;
}

async function createTask({ name, description, dueDate, workspaceId }) {
  const body = {
    name,
    workspaceId,
    priority: 'MEDIUM',
    duration: 60,
  };

  if (description) body.description = description;
  if (dueDate) body.dueDate = dueDate;

  const response = await fetch(`${MOTION_BASE_URL}/tasks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Motion API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function updateTask(motionId, { name, description, dueDate, completed, workspaceId }) {
  const body = {
    workspaceId,
    priority: 'MEDIUM',
    duration: 60,
  };

  if (name) body.name = name;
  if (description) body.description = description;
  if (dueDate) body.dueDate = dueDate;
  if (completed !== undefined) body.completed = completed;

  const response = await fetch(`${MOTION_BASE_URL}/tasks/${motionId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Motion API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

module.exports = { getWorkspaces, getWorkspaceIdByName, listTasks, createTask, updateTask };
