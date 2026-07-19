// src/pages/housekeeping/TasksPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Stack,
    Group,
    Text,
    Title,
    Tabs,
    TextInput,
    Button,
    SimpleGrid,
    Loader,
    Center,
    Badge,
    Card,
    ThemeIcon,
    ActionIcon,
    Chip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconSearch,
    IconFilter,
    IconRefresh,
    IconDoor,
    IconClock,
    IconPlayerPlay,
    IconCheck,
    IconCalendarStats,
    IconChevronRight
} from '@tabler/icons-react';
import { useHousekeepingTasks } from '../../hooks/useHousekeepingTasks';
import { format, isToday, isTomorrow, isAfter } from 'date-fns';

export default function TasksPage() {
    const navigate = useNavigate();
    const { tasks, todayTasks, counts, loading, startTask, refresh } = useHousekeepingTasks();
    const [activeTab, setActiveTab] = useState('today');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showFilters, { toggle: toggleFilters }] = useDisclosure(false);

    // Categorize tasks
    const upcomingTasks = tasks.filter(t => {
        if (!t.assignedAt) return false;
        const taskDate = new Date(t.assignedAt);
        return isTomorrow(taskDate) || isAfter(taskDate, new Date());
    });

    const overdueTasks = tasks.filter(t => {
        if (!t.assignedAt || t.status === 'COMPLETED') return false;
        const taskDate = new Date(t.assignedAt);
        return taskDate < new Date() && t.status !== 'COMPLETED';
    });

    // Filter tasks based on active tab
    const getDisplayTasks = () => {
        let filtered = [];

        switch(activeTab) {
            case 'today':
                filtered = todayTasks;
                break;
            case 'upcoming':
                filtered = upcomingTasks;
                break;
            case 'overdue':
                filtered = overdueTasks;
                break;
            case 'all':
                filtered = tasks;
                break;
            default:
                filtered = todayTasks;
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(t => t.status === statusFilter);
        }

        // Filter by search
        if (searchQuery) {
            filtered = filtered.filter(t =>
                t.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Sort by time
        return filtered.sort((a, b) => {
            if (!a.assignedAt) return 1;
            if (!b.assignedAt) return -1;
            return new Date(a.assignedAt) - new Date(b.assignedAt);
        });
    };

    const displayTasks = getDisplayTasks();

    // Group tasks by date
    const groupTasksByDate = (tasks) => {
        const groups = {};
        tasks.forEach(task => {
            if (!task.assignedAt) {
                if (!groups['No time']) groups['No time'] = [];
                groups['No time'].push(task);
                return;
            }
            const dateStr = format(new Date(task.assignedAt), 'EEEE, MMMM do, yyyy');
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(task);
        });
        return groups;
    };

    const taskGroups = groupTasksByDate(displayTasks);

    const handleStartTask = async (taskId) => {
        const result = await startTask(taskId);
        if (result.success) {
            refresh();
        }
    };

    if (loading) {
        return (
            <Center style={{ height: '60vh' }}>
                <Loader size="xl" />
            </Center>
        );
    }

    return (
        <Container size="lg" px={0}>
            <Stack gap="md">
                {/* Header */}
                <Group justify="space-between">
                    <div>
                        <Title order={1}>My Tasks</Title>
                        <Text size="sm" c="dimmed">
                            {counts.scheduled + counts.inProgress} tasks pending
                        </Text>
                    </div>
                    <Button
                        leftSection={<IconRefresh size={16} />}
                        variant="light"
                        onClick={refresh}
                    >
                        Refresh
                    </Button>
                </Group>

                {/* Main Tabs */}
                <Tabs value={activeTab} onChange={setActiveTab}>
                    <Tabs.List grow>
                        <Tabs.Tab value="today" leftSection={<IconClock size={16} />}>
                            Today ({todayTasks.length})
                        </Tabs.Tab>
                        <Tabs.Tab value="upcoming" leftSection={<IconCalendarStats size={16} />}>
                            Upcoming ({upcomingTasks.length})
                        </Tabs.Tab>
                        <Tabs.Tab value="overdue" leftSection={<IconDoor size={16} />}>
                            Overdue ({overdueTasks.length})
                        </Tabs.Tab>
                        <Tabs.Tab value="all">
                            All ({tasks.length})
                        </Tabs.Tab>
                    </Tabs.List>
                </Tabs>

                {/* Search and Filter */}
                <Group>
                    <TextInput
                        placeholder="Search room number..."
                        leftSection={<IconSearch size={16} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <ActionIcon
                        size="lg"
                        variant={showFilters ? 'filled' : 'light'}
                        onClick={toggleFilters}
                    >
                        <IconFilter size={20} />
                    </ActionIcon>
                </Group>

                {/* Filter Panel */}
                {showFilters && (
                    <Paper withBorder p="md" radius="md">
                        <Text size="sm" fw={500} mb="xs">Filter by status</Text>
                        <Group>
                            <Chip
                                value="all"
                                checked={statusFilter === 'all'}
                                onChange={() => setStatusFilter('all')}
                            >
                                All
                            </Chip>
                            <Chip
                                value="SCHEDULED"
                                checked={statusFilter === 'SCHEDULED'}
                                onChange={() => setStatusFilter('SCHEDULED')}
                            >
                                Scheduled
                            </Chip>
                            <Chip
                                value="IN_PROGRESS"
                                checked={statusFilter === 'IN_PROGRESS'}
                                onChange={() => setStatusFilter('IN_PROGRESS')}
                            >
                                In Progress
                            </Chip>
                            <Chip
                                value="COMPLETED"
                                checked={statusFilter === 'COMPLETED'}
                                onChange={() => setStatusFilter('COMPLETED')}
                            >
                                Completed
                            </Chip>
                        </Group>
                    </Paper>
                )}

                {/* Tasks List */}
                {displayTasks.length === 0 ? (
                    <Paper withBorder p="xl" radius="md">
                        <Center>
                            <Stack align="center" gap="md">
                                <IconDoor size={48} color="gray" />
                                <Title order={3}>No tasks found</Title>
                                <Text c="dimmed" ta="center">
                                    {searchQuery
                                        ? 'No matching rooms found'
                                        : 'You have no assigned tasks'}
                                </Text>
                            </Stack>
                        </Center>
                    </Paper>
                ) : (
                    <Stack gap="md">
                        {Object.entries(taskGroups).map(([date, tasks]) => (
                            <div key={date}>
                                <Text size="sm" fw={600} mb="xs" c="dimmed">
                                    {date}
                                </Text>
                                <Stack gap="sm">
                                    {tasks.map(task => (
                                        <Card
                                            key={task.id}
                                            withBorder
                                            padding="md"
                                            radius="md"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => navigate(`/housekeeping/tasks/${task.id}`)}
                                        >
                                            <Group justify="space-between">
                                                <Group>
                                                    <Badge
                                                        size="lg"
                                                        variant="filled"
                                                        color={task.status === 'COMPLETED' ? 'green' : 'blue'}
                                                    >
                                                        {task.roomNumber}
                                                    </Badge>
                                                    <div>
                                                        <Group gap="xs" mb={4}>
                                                            <Text fw={500}>{task.taskTypeDisplay}</Text>
                                                            {task.assignedAt && (
                                                                <Text size="xs" c="dimmed">
                                                                    {format(new Date(task.assignedAt), 'HH:mm')}
                                                                </Text>
                                                            )}
                                                        </Group>
                                                        <Badge
                                                            size="sm"
                                                            color={task.statusColor}
                                                            variant="dot"
                                                        >
                                                            {task.statusDisplay}
                                                        </Badge>
                                                    </div>
                                                </Group>
                                                <Group>
                                                    {task.status === 'SCHEDULED' && (
                                                        <Button
                                                            size="xs"
                                                            color="blue"
                                                            leftSection={<IconPlayerPlay size={12} />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStartTask(task.id);
                                                            }}
                                                        >
                                                            Start
                                                        </Button>
                                                    )}
                                                    {task.status === 'IN_PROGRESS' && (
                                                        <Button
                                                            size="xs"
                                                            color="green"
                                                            leftSection={<IconCheck size={12} />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/housekeeping/tasks/${task.id}`);
                                                            }}
                                                        >
                                                            Continue
                                                        </Button>
                                                    )}
                                                </Group>
                                            </Group>
                                        </Card>
                                    ))}
                                </Stack>
                            </div>
                        ))}
                    </Stack>
                )}
            </Stack>
        </Container>
    );
}