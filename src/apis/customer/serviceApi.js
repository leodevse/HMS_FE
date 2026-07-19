import axiosInstance from '../axiosConfig';

const asArray = (payload) => Array.isArray(payload) ? payload : (payload?.content || []);

const toCustomerService = (item) => ({
    id: item.id,
    name: item.serviceName,
    serviceCategory: item.category,
    price: Number(item.unitPrice || 0),
    description: item.description || '',
});

export const getServices = async (category = null, page = 0, size = 50) => {
    const effectiveSize = Number(size) || 50;
    let services = asArray((await axiosInstance.get('/catalog/services')).data).map(toCustomerService);
    if (category && category !== 'all') {
        services = services.filter((item) => item.serviceCategory === category);
    }
    const totalItems = services.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / effectiveSize));
    const start = page * effectiveSize;
    return {
        data: services.slice(start, start + effectiveSize),
        totalItems,
        totalPages,
        currentPage: page,
        pageSize: effectiveSize,
    };
};

export const getServiceCategories = async () => ['SPA', 'MINIBAR', 'F_AND_B'];
