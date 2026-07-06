require('dotenv').config();

const MOTION_BASE_URL = 'https://api.usemotion.com/v1';

function getHeaders() {
  return {
    'X-API-Key': process.env.MOTION_API_KEY,
    'Content-Type': 'application/json',
  };
}

// TODO: Implement these functions:
// - getWorkspaceIdByName(name) → workspace ID
// - getResolvedStatus(workspaceId) → resolved status name string
// - listTasks(workspaceId) → array of tasks
// - createTask({ name, description, dueDate, workspaceId }) → created task
// - updateTask(motionId, { name, description, dueDate, status }) → updated task

module.exports = { getWorkspaceIdByName, getResolvedStatus, listTasks, createTask, updateTask };
