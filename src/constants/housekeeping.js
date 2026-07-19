// src/constants/housekeeping.js
export const TASK_TYPES = {
    CLEANING: {
        value: 'CLEANING',
        label: 'Cleaning',
        icon: '🧹',
        color: 'blue'
    },
    INSPECTION: {
        value: 'INSPECTION',
        label: 'Inspection',
        icon: '🔍',
        color: 'violet'
    },
    MAINTENANCE_SUPPORT: {
        value: 'MAINTENANCE_SUPPORT',
        label: 'Maintenance',
        icon: '🔧',
        color: 'orange'
    }
};

export const TASK_STATUS = {
    SCHEDULED: {
        value: 'SCHEDULED',
        label: 'Scheduled',
        color: 'gray'
    },
    IN_PROGRESS: {
        value: 'IN_PROGRESS',
        label: 'In Progress',
        color: 'yellow'
    },
    COMPLETED: {
        value: 'COMPLETED',
        label: 'Completed',
        color: 'green'
    },
    CANCELLED: {
        value: 'CANCELLED',
        label: 'Cancelled',
        color: 'red'
    }
};

export const ROOM_STATUS = {
    AVAILABLE: {
        value: 'AVAILABLE',
        label: 'Available',
        color: 'green'
    },
    OCCUPIED: {
        value: 'OCCUPIED',
        label: 'Occupied',
        color: 'blue'
    },
    DIRTY: {
        value: 'DIRTY',
        label: 'Dirty',
        color: 'red'
    },
    CLEAN: {
        value: 'CLEAN',
        label: 'Clean',
        color: 'teal'
    },
    MAINTENANCE: {
        value: 'MAINTENANCE',
        label: 'Maintenance',
        color: 'orange'
    }
};