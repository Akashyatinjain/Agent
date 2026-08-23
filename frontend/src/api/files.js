import api from './client';

export const uploadFileApi = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
};

export const fetchFilesApi = async () => {
  const res = await api.get('/files');
  return res.data;
};

export const getFilesApi = fetchFilesApi;

export const deleteFileApi = async (id) => {
  const res = await api.delete(`/files/${id}`);
  return res.data;
};

export default { uploadFileApi, fetchFilesApi, getFilesApi, deleteFileApi };
