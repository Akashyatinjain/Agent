import api, { getBaseURL } from './client';

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

export const sendMessageStreamApi = async (
  { message, conversationId, model, attachedFile = null },
  onEvent,
  signal = null
) => {
  const token = localStorage.getItem('minigpt_token');
  const baseUrl = getBaseURL();
  const endpoint = `${baseUrl}/chat/message`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      message,
      conversationId,
      model,
      attachedFile,
      isStream: true
    }),
    signal
  });

  if (!response.ok) {
    let errorMsg = `Server returned status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.error?.message) errorMsg = errJson.error.message;
    } catch (e) {}
    throw new Error(errorMsg);
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
      if (!line.trim() || line.startsWith(':')) continue; // Skip heartbeat comments

      const eventMatch = line.match(/^event:\s*(.+)$/m);
      const dataMatch = line.match(/^data:\s*([\s\S]+)$/m);

      if (eventMatch && dataMatch) {
        const eventName = eventMatch[1].trim();
        try {
          const data = JSON.parse(dataMatch[1].trim());
          onEvent(eventName, data);
        } catch (jsonErr) {
          // Plain text token fallback
          onEvent(eventName, { chunk: dataMatch[1] });
        }
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
