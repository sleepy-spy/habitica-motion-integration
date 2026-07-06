require('dotenv').config();

const HABITICA_BASE_URL = 'https://habitica.com/api/v3';

function getHeaders() {
  return {
    'x-api-user': process.env.HABITICA_USER_ID,
    'x-api-key': process.env.HABITICA_API_KEY,
    'x-client': `${process.env.HABITICA_USER_ID}-habitica-motion-sync`,
    'Content-Type': 'application/json',
  };
}

async function fetchTodos() {
  const response = await fetch(`${HABITICA_BASE_URL}/tasks/user?type=todos`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Habitica API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return json.data;
}

module.exports = { fetchTodos };
