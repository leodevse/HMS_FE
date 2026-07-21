import axiosInstance from '../axiosConfig';

const STAFF_ROLES = ['ADMIN', 'RECEPTIONIST', 'HOUSEKEEPING'];

const ROLE_DEPARTMENT = { ADMIN: 'MANAGER', RECEPTIONIST: 'RECEPTION', HOUSEKEEPING: 'HOUSEKEEPING' };
const DEPARTMENT_ROLE = { MANAGER: 'ADMIN', RECEPTION: 'RECEPTIONIST', HOUSEKEEPING: 'HOUSEKEEPING' };

const normalizeStaff = (staff = {}) => ({
    ...staff,
    email: staff.email || staff.username || '',
    role: staff.role || staff.roleName || '',
    isActive: staff.isActive ?? staff.active ?? true,
    department: staff.department || ROLE_DEPARTMENT[staff.roleName] || '',
    status: staff.status || staff.employmentStatus || 'AVAILABLE',
    phoneNumber: staff.phoneNumber || '',
});

const normalizePage = (pages) => {
    const content = pages.flatMap((page) => page.content || []).map(normalizeStaff);
    return { content, totalElements: content.length, totalPages: 1, number: 0 };
};

export const staffApi = {
    getStaffs: async (params = {}) => {
        if (params.role && STAFF_ROLES.includes(params.role)) {
            const response = await axiosInstance.get('/auth/users', { params });
            return { ...response.data, content: (response.data?.content || []).map(normalizeStaff) };
        }
        const responses = await Promise.all(STAFF_ROLES.map((role) =>
            axiosInstance.get('/auth/users', { params: { page: 0, size: 200, role, isActive: params.isActive } })
        ));
        const page = normalizePage(responses.map((response) => response.data));
        const name = String(params.name || '').trim().toLowerCase();
        const email = String(params.email || '').trim().toLowerCase();
        const phone = String(params.phoneNumber || '').trim();
        page.content = page.content.filter((staff) =>
            (!name || String(staff.fullName || '').toLowerCase().includes(name))
            && (!email || staff.email.toLowerCase().includes(email))
            && (!phone || staff.phoneNumber.includes(phone))
            && (!params.department || staff.department === params.department)
            && (!params.status || staff.status === params.status));
        page.totalElements = page.content.length;
        return page;
    },
    getStaffById: async (id) => (await axiosInstance.get(`/auth/users/${id}`)).data,
    createStaff: async (data) => (await axiosInstance.post('/auth/register', {
        username: data.username || data.email,
        password: data.password,
        fullName: data.fullName || data.name,
        roleName: data.roleName || data.role || DEPARTMENT_ROLE[data.department],
        phoneNumber: data.phoneNumber,
        department: data.department,
        employmentStatus: data.status || 'AVAILABLE',
        active: data.isActive ?? true,
    })).data,
    updateStaff: async (id, data) => normalizeStaff((await axiosInstance.put(`/auth/users/${id}`, {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        department: data.department,
        employmentStatus: data.status,
        active: data.isActive,
    })).data),
    updateStaffStatus: async (id, isActive) => normalizeStaff((await axiosInstance.put(`/auth/users/${id}`, {
        active: isActive,
    })).data),
    deleteStaff: async (id) => (await axiosInstance.delete(`/auth/users/${id}`)).data,
    getAllStaff: async () => {
        const page = await staffApi.getStaffs({ size: 200, isActive: true });
        return Array.isArray(page?.content) ? page.content : [];
    },
};
