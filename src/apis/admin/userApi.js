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
    getCustomersPage: async (params) => {
        const response = await axiosInstance.get(API_URL, {
            params: {
                page: params?.page ?? 0,
                size: params?.size ?? 6,
                role: 'CUSTOMER',
                isActive: params?.isActive,
            },
        });
        const payload = response.data || {};
        const keyword = String(params?.email || '').trim().toLowerCase();
        const content = (Array.isArray(payload.content) ? payload.content : [])
            .map(normalizeUser)
            .filter((user) => !keyword || user.email.toLowerCase().includes(keyword));
        return {
            ...payload,
            content,
            totalElements: keyword ? content.length : (payload.totalElements ?? content.length),
            totalPages: keyword ? 1 : (payload.totalPages ?? 1),
        };
    },

    // Cập nhật trạng thái Active/Disable của user
    updateUserStatus: async (id, isActive) => {
        const response = await axiosInstance.put(`${API_URL}/${id}`, { active: isActive });
        return normalizeUser(response.data);
    },

    // Xóa user (nếu cần)
    deleteUser: async (id) => {
        const response = await axiosInstance.delete(`${API_URL}/${id}`);
        return response.data;
    }
};
