import api from './client';

export const fetchConversationsApi = async () => {
  const res = await api.get('/chat/conversations');
  return res.data;
};

export const fetchConversationByIdApi = async (id) => {
  const res = await api.get(`/chat/conversations/${id}`);
  return res.data;
};

export const deleteConversationApi = async (id) => {
  const res = await api.delete(`/chat/conversations/${id}`);
  return res.data;
};

export const sendMessageStreamApi = async ({ message, conversationId, model }, onEvent) => {
  const token = localStorage.getItem('minigpt_token');

  const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ message, conversationId, model, isStream: true })
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      const eventMatch = line.match(/^event:\s*(.+)$/m);
      const dataMatch = line.match(/^data:\s*(.+)$/m);

      if (eventMatch && dataMatch) {
        const eventName = eventMatch[1].trim();
        const data = JSON.parse(dataMatch[1].trim());
        onEvent(eventName, data);
      }
    }
  }
};

export default {
  fetchConversationsApi,
  fetchConversationByIdApi,
  deleteConversationApi,
  sendMessageStreamApi
};
