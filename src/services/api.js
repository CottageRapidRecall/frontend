const API_URL = import.meta.env.VITE_API_URL || 'https://rapidrecall-production.up.railway.app';

export const uploadRecall = async (file, uid) => {
  const formData = new FormData();
  formData.append('recall', file);
  formData.append('uid', uid);

  const response = await fetch(`${API_URL}/v1`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
};
