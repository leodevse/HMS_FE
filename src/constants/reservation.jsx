// types/reservation.ts (hoặc constants/reservation.ts)

const RESERVATION_STATUS_MAP = {
    PENDING_DEPOSIT: {label: "Chờ đặt cọc", color: "orange"},
    CONFIRMED: {label: "Đã xác nhận", color: "blue"},
    IN_HOUSE: {label: "Đang ở", color: "cyan"},
    CHECKED_OUT: {label: "Đã trả phòng", color: "grape"},
    FINISHED: {label: "Hoàn tất", color: "green"},
    CANCELLED: {label: "Đã hủy", color: "red"},
};

// Tự động tạo mảng Options cho Mantine Select từ Map trên
const STATUS_OPTIONS = Object.entries(RESERVATION_STATUS_MAP).map(([value, info]) => ({
    value,
    label: info.label,
}));

export {RESERVATION_STATUS_MAP, STATUS_OPTIONS};