// src/pages/housekeeping/HomePage.jsx
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    ActionIcon,
    Avatar,
    Badge,
    Button,
    Card,
    Container,
    Group,
    Paper,
    Progress,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title
} from '@mantine/core';
import {
    IconAlertCircle,
    IconBell,
    IconBottle,
    IconCalendarStats,
    IconChecklist,
    IconChevronRight
} from '@tabler/icons-react';
import {useAuth} from '../../hooks/useAuth';
import {useHousekeepingTasks} from '../../hooks/useHousekeepingTasks';
import {StatsCards} from './components/StatsCards';
import {format} from 'date-fns';

export const DashboardPage = () => {
    const navigate = useNavigate();
    const {user} = useAuth();
    const {tasks, todayTasks, counts, loading, refresh} = useHousekeepingTasks();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Urgent tasks (scheduled for today, not started yet)
    const urgentTasks = todayTasks
            .filter(t => t.status === 'SCHEDULED')
            .slice(0, 2);

    const greeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const formattedDate = format(currentTime, 'EEEE, MMMM do, yyyy');

    const completedToday = todayTasks.filter(t => t.status === 'COMPLETED').length;
    const progressValue = todayTasks.length > 0
            ? (completedToday / todayTasks.length) * 100
            : 0;

    return (
            <Container size="lg" px={0}>
                <Stack gap="md">
                    {/* Header with greeting and time */}
                    <Paper radius="lg" p="lg" withBorder>
                        <Group justify="space-between" align="flex-start">
                            <Group>
                                <Avatar
                                        size="xl"
                                        color="blue"
                                        radius="xl"
                                        style={{border: '3px solid var(--mantine-color-blue-2)'}}
                                >
                                    {user?.fullName?.charAt(0)}
                                </Avatar>
                                <div>
                                    <Text size="sm" c="dimmed">{greeting()},</Text>
                                    <Title order={3}>{user?.fullName}</Title>
                                    <Group gap="xs" mt={4}>
                                        <Badge color="blue" variant="light" size="sm">
                                            Housekeeping Staff
                                        </Badge>
                                        <Text size="xs" c="dimmed">{formattedDate}</Text>
                                    </Group>
                                </div>
                            </Group>
                            <ActionIcon
                                    variant="light"
                                    size="lg"
                                    radius="xl"
                                    onClick={refresh}
                            >
                                <IconBell size={20}/>
                            </ActionIcon>
                        </Group>
                    </Paper>

                    {/* Quick Stats */}
                    <StatsCards counts={counts}/>

                    {/* Today's Progress */}
                    <Paper radius="lg" p="lg" withBorder>
                        <Group justify="space-between" mb="xs">
                            <Group>
                                <ThemeIcon size="lg" color="green" variant="light">
                                    <IconCalendarStats size={20}/>
                                </ThemeIcon>
                                <Text fw={600}>Today's Progress</Text>
                            </Group>
                            <Text size="sm" fw={600} c="green">
                                {completedToday}/{todayTasks.length}
                            </Text>
                        </Group>
                        <Progress
                                value={progressValue}
                                color="green"
                                size="xl"
                                radius="xl"
                                striped
                                animated
                        />
                        <Text size="xs" c="dimmed" mt={4}>
                            {Math.round(progressValue)}% completed
                        </Text>
                    </Paper>

                    {/* Urgent Tasks */}
                    {urgentTasks.length > 0 && (
                            <Paper radius="lg" p="lg" withBorder bg="red.0">
                                <Group mb="md">
                                    <ThemeIcon color="red" size="lg" variant="light">
                                        <IconAlertCircle size={20}/>
                                    </ThemeIcon>
                                    <div>
                                        <Text fw={600}>Priority Tasks</Text>
                                        <Text size="xs" c="dimmed">
                                            Need to be done before guest check-in
                                        </Text>
                                    </div>
                                </Group>

                                <Stack gap="sm">
                                    {urgentTasks.map(task => (
                                            <Card
                                                    key={task.id}
                                                    withBorder
                                                    padding="sm"
                                                    radius="md"
                                                    style={{cursor: 'pointer'}}
                                                    onClick={() => navigate(`/housekeeping/tasks/${task.id}`)}
                                            >
                                                <Group justify="space-between">
                                                    <Group>
                                                        <Badge size="lg" color="red" variant="filled">
                                                            {task.roomNumber}
                                                        </Badge>
                                                        <div>
                                                            <Text size="sm" fw={500}>
                                                                {task.taskTypeDisplay}
                                                            </Text>
                                                            <Text size="xs" c="dimmed">
                                                                {task.assignedAt
                                                                        ? `Started: ${new Date(task.assignedAt).toLocaleTimeString()}`
                                                                        : 'Not started'}
                                                            </Text>
                                                        </div>
                                                    </Group>
                                                    <IconChevronRight size={16} color="gray"/>
                                                </Group>
                                            </Card>
                                    ))}
                                </Stack>
                            </Paper>
                    )}

                    {/* Today's Tasks */}
                    <Paper radius="lg" p="lg" withBorder>
                        <Group justify="space-between" mb="md">
                            <Group>
                                <ThemeIcon color="blue" size="lg" variant="light">
                                    <IconChecklist size={20}/>
                                </ThemeIcon>
                                <Text fw={600}>Today's Tasks</Text>
                            </Group>
                            <Button
                                    variant="subtle"
                                    size="xs"
                                    rightSection={<IconChevronRight size={14}/>}
                                    onClick={() => navigate('/housekeeping/tasks')}
                            >
                                View all
                            </Button>
                        </Group>

                        <Stack gap="sm">
                            {todayTasks.slice(0, 3).map(task => (
                                    <Card
                                            key={task.id}
                                            withBorder
                                            padding="sm"
                                            radius="md"
                                            style={{cursor: 'pointer'}}
                                            onClick={() => navigate(`/housekeeping/tasks/${task.id}`)}
                                    >
                                        <Group justify="space-between">
                                            <Group>
                                                <Badge size="lg" color="blue" variant="light">
                                                    {task.roomNumber}
                                                </Badge>
                                                <div>
                                                    <Text size="sm" fw={500}>
                                                        {task.taskTypeDisplay}
                                                    </Text>
                                                    <Group gap="xs">
                                                        <Badge
                                                                size="xs"
                                                                color={task.statusColor}
                                                                variant="dot"
                                                        >
                                                            {task.statusDisplay}
                                                        </Badge>
                                                        {task.assignedAt && (
                                                                <Text size="xs" c="dimmed">
                                                                    {new Date(task.assignedAt).toLocaleTimeString()}
                                                                </Text>
                                                        )}
                                                    </Group>
                                                </div>
                                            </Group>
                                            <IconChevronRight size={16} color="gray"/>
                                        </Group>
                                    </Card>
                            ))}
                        </Stack>
                    </Paper>

                    {/* Minibar/Damage Quick Stats */}
                    <SimpleGrid cols={2} spacing="md">
                        <Paper radius="lg" p="md" withBorder bg="violet.0">
                            <Group>
                                <ThemeIcon color="violet" size="lg" variant="light">
                                    <IconBottle size={20}/>
                                </ThemeIcon>
                                <div>
                                    <Text size="sm" c="dimmed">Minibar Today</Text>
                                    <Text fw={700}>2 reports</Text>
                                    <Text size="xs" c="dimmed">$15.50</Text>
                                </div>
                            </Group>
                        </Paper>
                        <Paper radius="lg" p="md" withBorder bg="orange.0">
                            <Group>
                                <ThemeIcon color="orange" size="lg" variant="light">
                                    <IconAlertCircle size={20}/>
                                </ThemeIcon>
                                <div>
                                    <Text size="sm" c="dimmed">Damage Today</Text>
                                    <Text fw={700}>1 report</Text>
                                    <Text size="xs" c="dimmed">$50.00</Text>
                                </div>
                            </Group>
                        </Paper>
                    </SimpleGrid>

                    {/* Quick Actions */}
                    <SimpleGrid cols={2} spacing="md">
                        <Button
                                variant="gradient"
                                gradient={{from: 'blue', to: 'cyan', deg: 90}}
                                size="lg"
                                radius="lg"
                                style={{height: 80}}
                                onClick={() => navigate('/housekeeping/tasks')}
                        >
                            <Stack align="center" gap={5}>
                                <IconChecklist size={28}/>
                                <Text size="sm">My Tasks</Text>
                            </Stack>
                        </Button>
                        <Button
                                variant="gradient"
                                gradient={{from: 'grape', to: 'violet', deg: 90}}
                                size="lg"
                                radius="lg"
                                style={{height: 80}}
                                onClick={() => navigate('/housekeeping/schedule')}
                        >
                            <Stack align="center" gap={5}>
                                <IconCalendarStats size={28}/>
                                <Text size="sm">Schedule</Text>
                            </Stack>
                        </Button>
                    </SimpleGrid>
                </Stack>
            </Container>
    );
}