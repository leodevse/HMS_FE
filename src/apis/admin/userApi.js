import axiosInstance from '../axiosConfig'; // Sửa lại đường dẫn tương đối cho đúng thư mục của bạn

const API_URL = '/auth/users';

const normalizeUser = (user = {}) => ({
    ...user,
    email: user.email || user.username || '',
    role: user.role || user.roleName || '',
    isActive: user.isActive ?? user.active ?? true,
});

export const userApi = {
    // Lấy danh sách khách hàng phân trang + filter
    getUsersPage: async (params) => {
        const response = await axiosInstance.get(API_URL, {
            params: {
                page: params?.page ?? 0,
                size: params?.size ?? 6,
                role: params?.role,
                isActive: params?.isActive,
                email: params?.email,
                name: params?.name,
                id: params?.id,
            },
        });
        const payload = response.data || {};
        const content = (Array.isArray(payload.content) ? payload.content : []).map(normalizeUser);
        return {
            ...payload,
            content,
            totalElements: payload.totalElements ?? content.length,
            totalPages: payload.totalPages ?? 1,
        };
    },

    // Cập nhật trạng thái Active/Disable của user
    updateUserStatus: async (id, isActive) => {
        const response = await axiosInstance.put(`${API_URL}/${id}`, { active: isActive });
        return normalizeUser(response.data);
    },

    // Cập nhật thông tin user
    updateUser: async (id, payload) => {
        const response = await axiosInstance.put(`${API_URL}/${id}`, payload);
        return normalizeUser(response.data);
    },

    // Xóa user (nếu cần)
    deleteUser: async (id) => {
        const response = await axiosInstance.delete(`${API_URL}/${id}`);
        return response.data;
    }
};
