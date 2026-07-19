// src/pages/housekeeping/TaskDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Stack,
    Group,
    Text,
    Title,
    Badge,
    Button,
    Card,
    ThemeIcon,
    Loader,
    Center,
    Alert,
    Timeline,
    SimpleGrid,
    Checkbox
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconArrowLeft,
    IconDoor,
    IconClock,
    IconPlayerPlay,
    IconCheck,
    IconAlertCircle,
    IconBottle
} from '@tabler/icons-react';
import { useHousekeepingTasks } from '../../hooks/useHousekeepingTasks';
import { MinibarModal } from './components/MinibarModal';
import { DamageModal } from './components/DamageModal';

export default function TaskDetailPage() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const {
        tasks,
        loading,
        startTask,
        completeTask,
        updateChecklistStep,
        reportMinibarConsumption,
        reportDamage,
        refreshAll,
        fetchMinibarItems  // THÊM DÒNG NÀY
    } = useHousekeepingTasks();

    const [task, setTask] = useState(null);
    const [minibarOpened, { open: openMinibar, close: closeMinibar }] = useDisclosure(false);
    const [damageOpened, { open: openDamage, close: closeDamage }] = useDisclosure(false);
    const [elapsedTime, setElapsedTime] = useState('');
    const [completedSteps, setCompletedSteps] = useState([]);

    useEffect(() => {
        if (tasks.length > 0) {
            const found = tasks.find(t => t.id === parseInt(taskId));
            setTask(found);
            if (found) {
                setCompletedSteps(Array.from({length: found.completedSteps || 0}, (_, index) => index));
            }
        }
    }, [tasks, taskId]);

    useEffect(() => {
        refreshAll();
    }, []);

    // Timer for tasks in progress
    useEffect(() => {
        let interval;
        if (task?.status === 'IN_PROGRESS' && task.startedAt) {
            interval = setInterval(() => {
                const start = new Date(task.startedAt).getTime();
                const now = new Date().getTime();
                const diff = Math.floor((now - start) / 1000); // seconds

                const hours = Math.floor(diff / 3600);
                const minutes = Math.floor((diff % 3600) / 60);
                const seconds = diff % 60;

                setElapsedTime(
                    `${hours.toString().padStart(2, '0')}:${minutes
                        .toString()
                        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                );
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [task]);

    const handleStartTask = async () => {
        const result = await startTask(task.id);
        if (result.success) {
            setTask(result.data);
            setCompletedSteps(Array.from({length: result.data.completedSteps || 0}, (_, index) => index));
        }
    };

    const handleCompleteTask = async () => {
        if ((task.checklist || []).length > 0 && completedSteps.length !== task.checklist.length) {
            return;
        }
        const result = await completeTask(task.id);
        if (result.success) {
            setTask(result.data);
        }
    };

    const handleMinibarSuccess = () => {
        refreshAll();
    };

    const handleDamageSuccess = () => {
        refreshAll();
    };

    if (loading || !task) {
        return (
            <Center style={{ height: '60vh' }}>
                <Loader size="xl" />
            </Center>
        );
    }

    return (
        <Container size="lg" px={0}>
            <Stack gap="md">
                {/* Back button */}
                <Button
                    variant="subtle"
                    leftSection={<IconArrowLeft size={16} />}
                    onClick={() => navigate('/housekeeping/tasks')}
                >
                    Back to tasks
                </Button>

                {/* Task Header */}
                <Paper withBorder radius="lg" p="lg">
                    <Stack>
                        <Group justify="space-between">
                            <Group>
                                <ThemeIcon size="xl" radius="md" color="blue">
                                    <IconDoor size={24} />
                                </ThemeIcon>
                                <div>
                                    <Title order={2}>Room {task.roomNumber}</Title>
                                    <Group gap="xs" mt={4}>
                                        <Badge size="lg" color="blue" variant="light">
                                            {task.taskTypeDisplay}
                                        </Badge>
                                        <Badge size="lg" color={task.statusColor}>
                                            {task.statusDisplay}
                                        </Badge>
                                    </Group>
                                </div>
                            </Group>
                        </Group>

                        {/* Timer for in-progress tasks */}
                        {task.status === 'IN_PROGRESS' && (
                            <Card withBorder bg="blue.0" radius="md">
                                <Group>
                                    <ThemeIcon color="blue" variant="light">
                                        <IconClock size={20} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="sm" c="dimmed">Time elapsed</Text>
                                        <Text fw={700} size="xl">{elapsedTime}</Text>
                                    </div>
                                </Group>
                            </Card>
                        )}

                        {/* Task Timeline */}
                        <Timeline active={task.status === 'COMPLETED' ? 2 : task.status === 'IN_PROGRESS' ? 1 : 0}>
                            <Timeline.Item bullet={<IconClock size={12} />} title="Assigned">
                                <Text size="sm" c="dimmed">Task has been assigned to you</Text>
                            </Timeline.Item>
                            <Timeline.Item bullet={<IconPlayerPlay size={12} />} title="In Progress">
                                <Text size="sm" c="dimmed">
                                    {task.startedAt
                                        ? `Started at ${new Date(task.startedAt).toLocaleString()}`
                                        : 'Not started yet'}
                                </Text>
                            </Timeline.Item>
                            <Timeline.Item bullet={<IconCheck size={12} />} title="Completed">
                                <Text size="sm" c="dimmed">
                                    {task.completedAt
                                        ? `Completed at ${new Date(task.completedAt).toLocaleString()}`
                                        : 'Not completed yet'}
                                </Text>
                            </Timeline.Item>
                        </Timeline>
                    </Stack>
                </Paper>

                {/* Standard operating procedure, completed in order. */}
                <Paper withBorder radius="lg" p="lg">
                    <Group justify="space-between" mb="md">
                        <div>
                            <Text fw={700}>Standard housekeeping checklist</Text>
                            <Text size="sm" c="dimmed">Complete each step in order before finishing the task.</Text>
                        </div>
                        <Badge color="blue" variant="light">
                            {completedSteps.length}/{task.checklist?.length || 0}
                        </Badge>
                    </Group>
                    <Stack gap="sm">
                        {(task.checklist || []).map((step, index) => {
                            const checked = completedSteps.includes(index);
                            const previousComplete = index === 0 || completedSteps.includes(index - 1);
                            return (
                                <Checkbox
                                    key={step}
                                    checked={checked}
                                    disabled={task.status !== 'IN_PROGRESS' || (!checked && !previousComplete)}
                                    label={`${index + 1}. ${step}`}
                                    onChange={async (event) => {
                                        const isChecked = event.currentTarget.checked;
                                        const result = await updateChecklistStep(task.id, index, isChecked);
                                        if (result.success) {
                                            setTask(result.data);
                                            setCompletedSteps(Array.from(
                                                {length: result.data.completedSteps || 0},
                                                (_, stepIndex) => stepIndex
                                            ));
                                        }
                                    }}
                                />
                            );
                        })}
                    </Stack>
                </Paper>

                {/* Room Information */}
                <Paper withBorder radius="lg" p="lg">
                    <Text fw={600} mb="md">Room Information</Text>
                    <SimpleGrid cols={2}>
                        <Card withBorder padding="sm">
                            <Text size="xs" c="dimmed">Room Status</Text>
                            <Group>
                                <Badge color={task.roomStatusColor} size="lg">
                                    {task.roomStatusDisplay}
                                </Badge>
                            </Group>
                        </Card>
                        <Card withBorder padding="sm">
                            <Text size="xs" c="dimmed">Assignee</Text>
                            <Text fw={500}>{task.assigneeName}</Text>
                        </Card>
                    </SimpleGrid>
                </Paper>

                {/* Action Buttons */}
                <Stack gap="sm">
                    {task.status === 'SCHEDULED' && (
                        <Button
                            size="lg"
                            color="blue"
                            leftSection={<IconPlayerPlay size={20} />}
                            onClick={handleStartTask}
                            fullWidth
                        >
                            Start Task
                        </Button>
                    )}

                    {task.status === 'IN_PROGRESS' && (
                        <>
                            <SimpleGrid cols={2} spacing="sm">
                                <Button
                                    size="md"
                                    color="violet"
                                    variant="light"
                                    leftSection={<IconBottle size={18} />}
                                    onClick={openMinibar}
                                >
                                    Minibar
                                </Button>
                                <Button
                                    size="md"
                                    color="red"
                                    variant="light"
                                    leftSection={<IconAlertCircle size={18} />}
                                    onClick={openDamage}
                                >
                                    Report Damage
                                </Button>
                            </SimpleGrid>
                            <Button
                                size="lg"
                                color="green"
                                leftSection={<IconCheck size={20} />}
                                onClick={handleCompleteTask}
                                disabled={(task.checklist || []).length > 0 && completedSteps.length !== task.checklist.length}
                                fullWidth
                            >
                                Complete Task
                            </Button>
                        </>
                    )}

                    {task.status === 'COMPLETED' && (
                        <Alert color="green" title="Task Completed">
                            This task has been completed. Thank you for your work!
                        </Alert>
                    )}
                </Stack>
            </Stack>

            {/* Modals */}
            <MinibarModal
                opened={minibarOpened}
                onClose={closeMinibar}
                roomId={task.roomId || 1}
                reservationId={task.reservationId || 1}
                onSuccess={handleMinibarSuccess}
                reportMinibar={reportMinibarConsumption}
                fetchMinibarItems={fetchMinibarItems}
            />

            <DamageModal
                opened={damageOpened}
                onClose={closeDamage}
                roomId={task.roomId || 1}
                reservationId={task.reservationId || 1}
                onSuccess={handleDamageSuccess}
                reportDamage={reportDamage}
            />
        </Container>
    );
}
