import api from './client';

export const getConnectedChannels = async () => {
  const response = await api.get('/integrations/channels');
  return response.data;
};

export const startChannelLink = async (channelType) => {
  const response = await api.post('/integrations/channels/link', { channelType });
  return response.data;
};

export const disconnectChannel = async (channelType) => {
  const response = await api.delete(`/integrations/channels/${channelType}`);
  return response.data;
};
