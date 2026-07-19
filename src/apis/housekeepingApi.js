import axiosInstance from './axiosConfig';

const TASK_URL = '/catalog/housekeeping-tasks';
const currentStaffId = () => Number(JSON.parse(localStorage.getItem('authUser') || 'null')?.id);
const wrapped = (data) => ({data: {data}});

const CLEANING_CHECKLIST = [
    'Mở cửa và thông gió phòng; kiểm tra đồ khách bỏ quên',
    'Thu gom rác, đồ vải bẩn và vật dụng đã sử dụng',
    'Tháo ga, vỏ gối; thay toàn bộ đồ vải sạch',
    'Làm sạch và khử khuẩn phòng tắm, bổ sung amenities',
    'Lau bụi đồ nội thất, thiết bị và các bề mặt tiếp xúc',
    'Kiểm tra, bổ sung minibar và nước uống',
    'Hút bụi/lau sàn từ trong ra ngoài',
    'Kiểm tra đèn, điều hòa, TV, khóa cửa và báo hư hỏng',
    'Setup phòng theo tiêu chuẩn và kiểm tra lần cuối',
];

const normalizeTask = (task = {}) => {
    const status = task.status === 'PENDING' ? 'SCHEDULED' : task.status;
    const statusMap = {
        SCHEDULED: ['Scheduled', 'yellow'],
        IN_PROGRESS: ['In progress', 'blue'],
        COMPLETED: ['Completed', 'green'],
    };
    const taskTypeMap = {
        CLEANING: 'Room turnover cleaning',
        INSPECTION: 'Room inspection',
        MAINTENANCE_SUPPORT: 'Maintenance support',
    };
    return {
        ...task,
        status,
        assignedAt: task.scheduledAt || task.createdAt,
        taskTypeDisplay: taskTypeMap[task.taskType] || task.taskType,
        statusDisplay: statusMap[status]?.[0] || status,
        statusColor: statusMap[status]?.[1] || 'gray',
        roomStatusDisplay: task.taskType === 'CLEANING' ? 'CLEANING' : 'MAINTENANCE',
        roomStatusColor: task.taskType === 'CLEANING' ? 'violet' : 'orange',
        checklist: task.taskType === 'CLEANING' ? CLEANING_CHECKLIST : [
            'Kiểm tra hiện trạng phòng',
            'Thực hiện công việc được giao',
            'Kiểm tra kết quả và báo cáo bất thường',
        ],
    };
};

const getTasks = async () => {
    const staffId = currentStaffId();
    const response = await axiosInstance.get(TASK_URL, {
        params: Number.isFinite(staffId) ? {staffId} : undefined,
    });
    return (Array.isArray(response.data) ? response.data : []).map(normalizeTask);
};

export const housekeepingApi = {
    getMyTasks: async () => wrapped(await getTasks()),
    getTodayTasks: async () => {
        const today = new Date().toISOString().slice(0, 10);
        return wrapped((await getTasks()).filter((task) => String(task.assignedAt || '').slice(0, 10) === today));
    },
    getTaskById: async (id) => wrapped(normalizeTask((await axiosInstance.get(`${TASK_URL}/${id}`)).data)),
    startTask: async (taskId) => wrapped(normalizeTask((await axiosInstance.patch(`${TASK_URL}/${taskId}/status`, {status: 'IN_PROGRESS'})).data)),
    completeTask: async (taskId) => wrapped(normalizeTask((await axiosInstance.patch(`${TASK_URL}/${taskId}/status`, {status: 'COMPLETED'})).data)),
    getTaskCounts: async () => {
        const tasks = await getTasks();
        const scheduled = tasks.filter((task) => task.status === 'SCHEDULED').length;
        const inProgress = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
        const completed = tasks.filter((task) => task.status === 'COMPLETED').length;
        return wrapped({scheduled, pending: scheduled, inProgress, completed, total: tasks.length});
    },
    getMinibarItems: async () => wrapped([]),
    reportMinibarConsumption: async () => { throw new Error('Minibar is not implemented by the backend'); },
    getMinibarHistory: async () => wrapped([]),
    reportDamage: async () => { throw new Error('Damage reports are not implemented by the backend'); },
    getMyDamageReports: async () => wrapped([]),
    resolveDamage: async () => { throw new Error('Damage reports are not implemented by the backend'); },
    getMySchedule: async (startDate, endDate) => {
        const staffId = currentStaffId();
        const today = new Date().toISOString().slice(0, 10);
        const [{data: schedules}, {data: shifts}] = await Promise.all([
            axiosInstance.get('/auth/schedules', {params: {startDate: startDate || today, endDate: endDate || startDate || today}}),
            axiosInstance.get('/auth/shifts'),
        ]);
        const shiftById = new Map((Array.isArray(shifts) ? shifts : []).map((shift) => [Number(shift.id), shift]));
        return wrapped((Array.isArray(schedules) ? schedules : [])
            .filter((schedule) => Number(schedule.staffId) === staffId)
            .map((schedule) => {
                const shift = shiftById.get(Number(schedule.shiftId)) || {};
                return {...schedule, date: schedule.workDate, startTime: shift.startTime, endTime: shift.endTime};
            }));
    },
    getTodaySchedule: async () => {
        const today = new Date().toISOString().slice(0, 10);
        const response = await housekeepingApi.getMySchedule(today, today);
        return wrapped(response.data.data[0] || null);
    },
    getScheduleSummary: async () => wrapped({}),
    getPerformanceReport: async () => wrapped([]),
};
