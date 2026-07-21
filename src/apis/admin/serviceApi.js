import axiosInstance from '../axiosConfig';

const API_URL = '/catalog/services';

const categoryLabelToEnum = {
    Spa: 'SPA',
    Minibar: 'MINIBAR',
    'F&B': 'F_AND_B',
};

const categoryEnumToLabel = {
    SPA: 'Spa',
    MINIBAR: 'Minibar',
    F_AND_B: 'F&B',
};

function toUiService(item) {
    return {
        id: item.id,
        name: item.serviceName,
        serviceCategory: categoryEnumToLabel[item.category] || item.category,
        price: Number(item.unitPrice || 0),
        description: item.description || '',
        duration: item.duration || item.serviceDuration || '-',
        availability: typeof item.available !== 'undefined'
            ? (item.available ? 'Yes' : 'No')
            : (item.isActive || item.active ? 'Yes' : 'No'),
        isActive: item.isActive ?? item.active ?? true,
    };
}

export const adminServiceApi = {
    getServices: async (params = {}) => {
        const response = await axiosInstance.get(API_URL, {
            params: {
                page: 0,
                size: 200,
                sort: 'id,desc',
                ...params,
            },
        });

        const payload = response.data;
        const content = Array.isArray(payload) ? payload : (Array.isArray(payload?.content) ? payload.content : []);
        return content.map(toUiService);
    },

    createService: async (data) => {
        const payload = {
            serviceName: data.name,
            unitPrice: Number(data.price),
            category: categoryLabelToEnum[data.serviceCategory] || data.serviceCategory,
            description: data.description || null,
            duration: data.duration || null,
            available: data.availability === 'Yes',
        };

        const response = await axiosInstance.post(API_URL, payload);
        return toUiService(response.data);
    },

    updateService: async (id, data) => {
        const payload = {
            serviceName: data.name,
            unitPrice: Number(data.price),
            category: categoryLabelToEnum[data.serviceCategory] || data.serviceCategory,
            description: data.description || null,
            duration: data.duration || null,
            available: data.availability === 'Yes',
        };

        const response = await axiosInstance.put(`${API_URL}/${id}`, payload);
        return toUiService(response.data);
    },

    deleteService: async (id) => {
        await axiosInstance.delete(`${API_URL}/${id}`);
    },
};
