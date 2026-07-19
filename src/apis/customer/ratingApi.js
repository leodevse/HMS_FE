import axiosInstance from '../axiosConfig';

export const getRoomClassRatings = async (_roomClassId, page = 0, size = 5) =>
    (await axiosInstance.get('/reviews', { params: { page, size } })).data;
