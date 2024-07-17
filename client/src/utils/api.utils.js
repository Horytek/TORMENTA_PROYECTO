export const handleApiResponse = async (apiFunction) => {
  try {
    const response = await apiFunction();
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};