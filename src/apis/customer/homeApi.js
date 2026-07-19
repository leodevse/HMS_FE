import axiosInstance from '../axiosConfig';

export const getHomeData = async () => {
    const [roomClasses, services] = await Promise.all([
        axiosInstance.get('/catalog/room-classes', { params: { size: 6 } }),
        axiosInstance.get('/catalog/services', { params: { size: 6 } }),
    ]);
    return {
        roomClasses: roomClasses.data?.content || [],
        services: services.data?.content || [],
    };
};
