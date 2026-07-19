// src/pages/housekeeping/SchedulePage.jsx
import {useEffect, useState} from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Container,
    Group,
    Paper,
    ScrollArea,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    ThemeIcon,
    Timeline,
    Title
} from '@mantine/core';
import {useNavigate} from 'react-router-dom';
import {
    IconArrowLeft,
    IconCalendar,
    IconCalendarStats,
    IconCheck,
    IconChevronLeft,
    IconChevronRight,
    IconClock,
    IconMoon,
    IconSun,
    IconSunset,
    IconX
} from '@tabler/icons-react';
import {
    addDays,
    eachDayOfInterval,
    endOfWeek,
    format,
    isSameDay,
    isValid,
    parseISO,
    startOfWeek,
    subDays
} from 'date-fns';
import {useHousekeepingTasks} from '../../hooks/useHousekeepingTasks';

export default function SchedulePage() {
    const navigate = useNavigate();
    const {
        schedule,
        todaySchedule,
        scheduleSummary,
        loading,
        fetchMySchedule,
        fetchTodaySchedule,
        fetchScheduleSummary,
        refreshAll
    } = useHousekeepingTasks();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [weekDays, setWeekDays] = useState([]);
    const [loadingWeek, setLoadingWeek] = useState(false);

    // Safe date formatting function
    const safeFormat = (date, formatStr) => {
        try {
            if (!date) return '';
            const dateObj = typeof date === 'string' ? parseISO(date) : date;
            if (!isValid(dateObj)) return '';
            return format(dateObj, formatStr);
        } catch (error) {
            console.error('Date formatting error:', error);
            return '';
        }
    };

    // Hàm lấy icon cho shift
    const getShiftIcon = (shiftName) => {
        const name = shiftName?.toLowerCase() || '';
        if (name.includes('morning')) return <IconSun size={16} color="orange"/>;
        if (name.includes('afternoon')) return <IconSunset size={16} color="orange"/>;
        if (name.includes('night')) return <IconMoon size={16} color="indigo"/>;
        return <IconClock size={16}/>;
    };

    // Hàm lấy màu cho shift
    const getShiftColor = (shiftName) => {
        const name = shiftName?.toLowerCase() || '';
        if (name.includes('morning')) return 'yellow';
        if (name.includes('afternoon')) return 'orange';
        if (name.includes('night')) return 'indigo';
        return 'blue';
    };

    // Hàm sắp xếp ca theo thứ tự: Morning → Afternoon → Night
    const sortShiftsByTime = (shifts) => {
        const shiftOrder = {
            'Morning': 1,
            'Afternoon': 2,
            'Night': 3,
            'Morning Shift': 1,
            'Afternoon Shift': 2,
            'Night Shift': 3
        };

        return [...shifts].sort((a, b) => {
            const orderA = shiftOrder[a.shiftName] || 999;
            const orderB = shiftOrder[b.shiftName] || 999;

            if (orderA !== orderB) {
                return orderA - orderB;
            }

            if (a.startTime && b.startTime) {
                return a.startTime.localeCompare(b.startTime);
            }
            return 0;
        });
    };

    // Lấy tất cả shifts cho một ngày
    const getShiftsForDate = (date) => {
        if (!schedule || !Array.isArray(schedule)) return [];
        const shifts = schedule.filter(shift => {
            try {
                if (!shift.date) return false;
                const shiftDate = typeof shift.date === 'string' ? parseISO(shift.date) : new Date(shift.date);
                return isValid(shiftDate) && isSameDay(shiftDate, date);
            } catch (error) {
                return false;
            }
        });

        return sortShiftsByTime(shifts);
    };

    // Lấy shift count cho badge
    const getShiftCountForDate = (date) => {
        return getShiftsForDate(date).length;
    };

    useEffect(() => {
        // Calculate week days based on selected date
        const start = startOfWeek(selectedDate, {weekStartsOn: 1}); // Monday
        const end = endOfWeek(selectedDate, {weekStartsOn: 1}); // Sunday
        const days = eachDayOfInterval({start, end});
        setWeekDays(days);

        // Load schedule for the week
        loadWeekSchedule(start, end);
    }, [selectedDate]);

    // Initial load
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoadingWeek(true);
        try {
            await Promise.all([
                fetchTodaySchedule(),
                fetchScheduleSummary()
            ]);
        } catch (error) {
            console.error('Error isLoading initial schedule data:', error);
        } finally {
            setLoadingWeek(false);
        }
    };

    const loadWeekSchedule = async (startDate, endDate) => {
        setLoadingWeek(true);
        try {
            await fetchMySchedule(
                    format(startDate, 'yyyy-MM-dd'),
                    format(endDate, 'yyyy-MM-dd')
            );
        } catch (error) {
            console.error('Error isLoading week schedule:', error);
        } finally {
            setLoadingWeek(false);
        }
    };

    const goToPreviousWeek = () => {
        setSelectedDate(prev => subDays(prev, 7));
    };

    const goToNextWeek = () => {
        setSelectedDate(prev => addDays(prev, 7));
    };

    const goToToday = () => {
        setSelectedDate(new Date());
        loadInitialData();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETED':
                return 'green';
            case 'IN_PROGRESS':
                return 'yellow';
            case 'SCHEDULED':
                return 'blue';
            case 'OFF':
                return 'gray';
            default:
                return 'gray';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'COMPLETED':
                return <IconCheck size={14}/>;
            case 'IN_PROGRESS':
                return <IconClock size={14}/>;
            case 'SCHEDULED':
                return <IconCalendar size={14}/>;
            case 'OFF':
                return <IconX size={14}/>;
            default:
                return null;
        }
    };

    if (loading && loadingWeek) {
        return (
                <Container size="lg" px={0}>
                    <Stack gap="md">
                        <Skeleton height={50} radius="md"/>
                        <Skeleton height={200} radius="md"/>
                        <Skeleton height={150} radius="md"/>
                    </Stack>
                </Container>
        );
    }

    return (
            <Container size="lg" px={0}>
                <Stack gap="md">
                    {/* Header */}
                    <Group justify="space-between">
                        <Group>
                            <Button
                                    variant="subtle"
                                    leftSection={<IconArrowLeft size={16}/>}
                                    onClick={() => navigate('/housekeeping')}
                            >
                                Back
                            </Button>
                            <Title order={2}>My Schedule</Title>
                        </Group>
                        <Button variant="light" onClick={goToToday}>
                            Today
                        </Button>
                    </Group>

                    {/* Week Navigation */}
                    <Paper withBorder radius="lg" p="md">
                        <Group justify="space-between">
                            <Button variant="subtle" onClick={goToPreviousWeek}>
                                <IconChevronLeft size={18}/>
                            </Button>
                            <Text fw={600}>
                                {weekDays.length > 0 ?
                                        `${safeFormat(weekDays[0], 'MMM d')} - ${safeFormat(weekDays[6], 'MMM d, yyyy')}`
                                        : 'Loading...'}
                            </Text>
                            <Button variant="subtle" onClick={goToNextWeek}>
                                <IconChevronRight size={18}/>
                            </Button>
                        </Group>
                    </Paper>

                    {/* Week Calendar */}
                    {weekDays.length > 0 && (
                            <SimpleGrid cols={7} spacing="xs">
                                {weekDays.map((day, index) => {
                                    const shiftCount = getShiftCountForDate(day);
                                    const shifts = getShiftsForDate(day);
                                    const firstShift = shifts[0];

                                    return (
                                            <Paper
                                                    key={index}
                                                    withBorder
                                                    p="xs"
                                                    style={{
                                                        textAlign: 'center',
                                                        backgroundColor: isSameDay(day, new Date()) ? 'var(--mantine-color-blue-0)' : 'white',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        border: isSameDay(day, selectedDate) ? '2px solid var(--mantine-color-blue-6)' : '1px solid var(--mantine-color-gray-3)',
                                                        position: 'relative'
                                                    }}
                                                    onClick={() => setSelectedDate(day)}
                                            >
                                                <Text size="xs" c="dimmed">{safeFormat(day, 'EEE')}</Text>
                                                <Text fw={700} size="lg">{safeFormat(day, 'd')}</Text>
                                                {loadingWeek ? (
                                                        <Skeleton height={20} width={60} mt={4}/>
                                                ) : (
                                                        <>
                                                            {shiftCount > 0 ? (
                                                                    <>
                                                                        <Badge
                                                                                size="sm"
                                                                                color="blue"
                                                                                variant="filled"
                                                                                style={{
                                                                                    position: 'absolute',
                                                                                    top: 2,
                                                                                    right: 2,
                                                                                    minWidth: 20,
                                                                                    height: 20,
                                                                                    padding: 0
                                                                                }}
                                                                        >
                                                                            {shiftCount}
                                                                        </Badge>
                                                                        <Badge
                                                                                size="xs"
                                                                                color={getShiftColor(firstShift?.shiftName)}
                                                                                variant="light"
                                                                                mt={4}
                                                                        >
                                                                            {firstShift?.shiftName?.split(' ')[0] || 'Shift'}
                                                                        </Badge>
                                                                    </>
                                                            ) : (
                                                                    <Text size="xs" c="dimmed" mt={4}>Off</Text>
                                                            )}
                                                        </>
                                                )}
                                            </Paper>
                                    );
                                })}
                            </SimpleGrid>
                    )}

                    {/* Today's Schedule Summary */}
                    {todaySchedule && (
                            <Paper withBorder radius="lg" p="lg" bg="blue.0">
                                <Group mb="md">
                                    <ThemeIcon size="lg" color="blue" variant="light">
                                        <IconCalendarStats size={20}/>
                                    </ThemeIcon>
                                    <Title order={4}>Today's Schedule</Title>
                                </Group>

                                <SimpleGrid cols={2} spacing="md">
                                    <Card withBorder>
                                        <Text size="sm" c="dimmed">Shift</Text>
                                        <Text fw={600} size="lg">{todaySchedule.shiftName || 'Day Off'}</Text>
                                    </Card>
                                    <Card withBorder>
                                        <Text size="sm" c="dimmed">Status</Text>
                                        <Badge size="lg" color={getStatusColor(todaySchedule.status)}>
                                            {todaySchedule.status || 'OFF'}
                                        </Badge>
                                    </Card>
                                    {todaySchedule.startTime && (
                                            <>
                                                <Card withBorder>
                                                    <Text size="sm" c="dimmed">Start Time</Text>
                                                    <Group>
                                                        <IconClock size={18}/>
                                                        <Text fw={600}>{todaySchedule.startTime}</Text>
                                                    </Group>
                                                </Card>
                                                <Card withBorder>
                                                    <Text size="sm" c="dimmed">End Time</Text>
                                                    <Group>
                                                        <IconClock size={18}/>
                                                        <Text fw={600}>{todaySchedule.endTime}</Text>
                                                    </Group>
                                                </Card>
                                            </>
                                    )}
                                </SimpleGrid>
                            </Paper>
                    )}

                    {/* Daily Schedule - Hiển thị tất cả các ngày trong tuần */}
                    {schedule && Array.isArray(schedule) && weekDays.length > 0 && (
                            <Stack gap="md">
                                <Title order={3}>Weekly Schedule</Title>
                                <ScrollArea style={{height: 400}} offsetScrollbars>
                                    <Stack gap="md">
                                        {weekDays.map((day, index) => {
                                            const shifts = getShiftsForDate(day);
                                            const isToday = isSameDay(day, new Date());

                                            return (
                                                    <Paper
                                                            key={index}
                                                            withBorder
                                                            radius="lg"
                                                            p="lg"
                                                            bg={isToday ? 'blue.0' : 'white'}
                                                            style={{
                                                                border: isToday ? '2px solid var(--mantine-color-blue-6)' : '1px solid var(--mantine-color-gray-3)'
                                                            }}
                                                    >
                                                        <Group justify="space-between" mb="md">
                                                            <Group>
                                                                <ThemeIcon size="lg" color="blue" variant="light">
                                                                    <IconCalendarStats size={20}/>
                                                                </ThemeIcon>
                                                                <div>
                                                                    <Title order={4}>
                                                                        {safeFormat(day, 'EEEE, MMMM d, yyyy')}
                                                                        {isToday && <Badge color="blue"
                                                                                           ml="sm">Today</Badge>}
                                                                    </Title>
                                                                    <Text size="sm" c="dimmed">
                                                                        {shifts.length > 0 ? `${shifts.length} shift(s)` : 'No shifts'}
                                                                    </Text>
                                                                </div>
                                                            </Group>
                                                        </Group>

                                                        {shifts.length === 0 ? (
                                                                <Alert color="gray" title="Day Off">
                                                                    You don't have any shifts scheduled for this day.
                                                                </Alert>
                                                        ) : (
                                                                <Stack>
                                                                    {shifts.map((shift, shiftIndex) => (
                                                                            <Card key={shiftIndex} withBorder>
                                                                                <Group justify="space-between" mb="xs">
                                                                                    <Group>
                                                                                        <ThemeIcon
                                                                                                size="sm"
                                                                                                color={getShiftColor(shift.shiftName)}
                                                                                                variant="light"
                                                                                        >
                                                                                            {getShiftIcon(shift.shiftName)}
                                                                                        </ThemeIcon>
                                                                                        <Text fw={600}>{shift.shiftName}</Text>
                                                                                    </Group>
                                                                                    <Badge
                                                                                            size="lg"
                                                                                            color={getStatusColor(shift.status)}
                                                                                    >
                                                                                        {shift.status}
                                                                                    </Badge>
                                                                                </Group>

                                                                                <SimpleGrid cols={2} spacing="sm"
                                                                                            mb="xs">
                                                                                    <Card withBorder padding="xs">
                                                                                        <Text size="xs" c="dimmed">Start
                                                                                            Time</Text>
                                                                                        <Group>
                                                                                            <IconClock size={14}/>
                                                                                            <Text fw={500}>{shift.startTime || '--:--'}</Text>
                                                                                        </Group>
                                                                                    </Card>
                                                                                    <Card withBorder padding="xs">
                                                                                        <Text size="xs" c="dimmed">End
                                                                                            Time</Text>
                                                                                        <Group>
                                                                                            <IconClock size={14}/>
                                                                                            <Text fw={500}>{shift.endTime || '--:--'}</Text>
                                                                                        </Group>
                                                                                    </Card>
                                                                                </SimpleGrid>

                                                                                {shift.totalTasks !== undefined && (
                                                                                        <Card withBorder padding="xs">
                                                                                            <Group justify="space-between">
                                                                                                <div>
                                                                                                    <Text size="xs"
                                                                                                          c="dimmed">Tasks
                                                                                                        Completed</Text>
                                                                                                    <Text fw={600}>
                                                                                                        {shift.completedTasks || 0}/{shift.totalTasks}
                                                                                                    </Text>
                                                                                                </div>
                                                                                                <Button
                                                                                                        size="xs"
                                                                                                        variant="light"
                                                                                                        onClick={() => navigate('/housekeeping/tasks')}
                                                                                                >
                                                                                                    View Tasks
                                                                                                </Button>
                                                                                            </Group>
                                                                                        </Card>
                                                                                )}
                                                                            </Card>
                                                                    ))}
                                                                </Stack>
                                                        )}
                                                    </Paper>
                                            );
                                        })}
                                    </Stack>
                                </ScrollArea>
                            </Stack>
                    )}

                    {/* Weekly Summary */}
                    {scheduleSummary && (
                            <Paper withBorder radius="lg" p="lg">
                                <Title order={4} mb="md">Week Summary</Title>
                                <SimpleGrid cols={{base: 2, sm: 4}} spacing="md">
                                    <Card withBorder>
                                        <Text size="xs" c="dimmed">Total Shifts</Text>
                                        <Text fw={700} size="xl">{scheduleSummary.totalShifts || 0}</Text>
                                    </Card>
                                    <Card withBorder>
                                        <Text size="xs" c="dimmed">Total Hours</Text>
                                        <Text fw={700} size="xl">{scheduleSummary.totalHours || 0}h</Text>
                                    </Card>
                                    <Card withBorder>
                                        <Text size="xs" c="dimmed">Completed</Text>
                                        <Text fw={700} size="xl">{scheduleSummary.completedShifts || 0}</Text>
                                    </Card>
                                    <Card withBorder>
                                        <Text size="xs" c="dimmed">Upcoming</Text>
                                        <Text fw={700} size="xl">{scheduleSummary.upcomingShifts || 0}</Text>
                                    </Card>
                                </SimpleGrid>
                            </Paper>
                    )}

                    {/* Upcoming Shifts Timeline */}
                    {schedule && Array.isArray(schedule) && schedule.length > 0 && (
                            <Paper withBorder radius="lg" p="lg">
                                <Title order={4} mb="md">Upcoming Shifts</Title>
                                <Timeline active={scheduleSummary?.completedShifts || 0}>
                                    {schedule
                                            .filter(shift => shift.status !== 'OFF')
                                            .slice(0, 5)
                                            .map((shift, index) => (
                                                    <Timeline.Item
                                                            key={index}
                                                            bullet={getShiftIcon(shift.shiftName)}
                                                            title={shift.shiftName}
                                                    >
                                                        <Text size="sm">
                                                            {safeFormat(shift.date, 'EEEE, MMMM d')} • {shift.startTime || '--:--'} - {shift.endTime || '--:--'}
                                                        </Text>
                                                        {shift.totalTasks !== undefined && (
                                                                <Text size="xs" c="dimmed" mt={4}>
                                                                    {shift.totalTasks} tasks scheduled
                                                                </Text>
                                                        )}
                                                    </Timeline.Item>
                                            ))}
                                </Timeline>
                            </Paper>
                    )}
                </Stack>
            </Container>
    );
}