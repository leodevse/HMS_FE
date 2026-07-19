// src/pages/housekeeping/ReportsPage.jsx
import { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Stack,
    Group,
    Text,
    Title,
    Card,
    ThemeIcon,
    Badge,
    Button,
    Select,
    SimpleGrid,
    Divider,
    Loader,
    Center,
    Progress,
    RingProgress,
    Table,
    Grid,
    Alert
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import {
    IconArrowLeft,
    IconChartBar,
    IconChecklist,
    IconClock,
    IconCheck,
    IconBottle,
    IconAlertCircle,
    IconCalendarStats,
    IconDownload,
    IconStar,
    IconTrendingUp
} from '@tabler/icons-react';
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from 'date-fns';
import { useHousekeepingTasks } from '../../hooks/useHousekeepingTasks';

export default function ReportsPage() {
    const navigate = useNavigate();
    const { performanceReport, fetchPerformanceReport, loading } = useHousekeepingTasks();
    const [period, setPeriod] = useState('week');
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

    useEffect(() => {
        loadReportData();
    }, [period]);

    const loadReportData = async () => {
        const today = new Date();
        let startDate, endDate;

        switch(period) {
            case 'week':
                startDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                endDate = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                break;
            case 'month':
                startDate = format(startOfMonth(today), 'yyyy-MM-dd');
                endDate = format(endOfMonth(today), 'yyyy-MM-dd');
                break;
            case 'quarter':
                startDate = format(startOfQuarter(today), 'yyyy-MM-dd');
                endDate = format(endOfQuarter(today), 'yyyy-MM-dd');
                break;
            default:
                startDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                endDate = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        }

        setDateRange({ startDate, endDate });
        await fetchPerformanceReport(startDate, endDate);
    };

    const getPeriodLabel = () => {
        switch(period) {
            case 'week': return 'This Week';
            case 'month': return 'This Month';
            case 'quarter': return 'This Quarter';
            default: return 'This Week';
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value || 0);
    };

    const formatPercentage = (value) => {
        return `${(value || 0).toFixed(1)}%`;
    };

    const handleExport = () => {
        // TODO: Implement export functionality
        console.log('Exporting report...');
    };

    if (loading) {
        return (
            <Center style={{ height: '60vh' }}>
                <Loader size="xl" />
            </Center>
        );
    }

    if (!performanceReport) {
        return (
            <Container size="lg" px={0}>
                <Stack gap="md">
                    <Group justify="space-between">
                        <Group>
                            <Button
                                variant="subtle"
                                leftSection={<IconArrowLeft size={16} />}
                                onClick={() => navigate('/housekeeping')}
                            >
                                Back
                            </Button>
                            <Title order={2}>My Reports</Title>
                        </Group>
                        <Group>
                            <Select
                                value={period}
                                onChange={setPeriod}
                                data={[
                                    { value: 'week', label: 'This Week' },
                                    { value: 'month', label: 'This Month' },
                                    { value: 'quarter', label: 'This Quarter' }
                                ]}
                                w={150}
                            />
                        </Group>
                    </Group>
                    <Alert color="blue" title="No Data">
                        No report data available for the selected period.
                    </Alert>
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
                            leftSection={<IconArrowLeft size={16} />}
                            onClick={() => navigate('/housekeeping')}
                        >
                            Back
                        </Button>
                        <Title order={2}>My Reports</Title>
                    </Group>
                    <Group>
                        <Select
                            value={period}
                            onChange={setPeriod}
                            data={[
                                { value: 'week', label: 'This Week' },
                                { value: 'month', label: 'This Month' },
                                { value: 'quarter', label: 'This Quarter' }
                            ]}
                            w={150}
                        />
                        <Button
                            leftSection={<IconDownload size={16} />}
                            variant="light"
                            onClick={handleExport}
                        >
                            Export
                        </Button>
                    </Group>
                </Group>

                {/* Date Range Info */}
                {dateRange.startDate && dateRange.endDate && (
                    <Text size="sm" c="dimmed" ta="center">
                        Period: {format(new Date(dateRange.startDate), 'MMMM d, yyyy')} - {format(new Date(dateRange.endDate), 'MMMM d, yyyy')}
                    </Text>
                )}

                {/* Key Metrics */}
                <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
                    <Paper withBorder p="lg" radius="lg">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed">Total Tasks</Text>
                                <Text fw={700} size="28px">{performanceReport.totalTasks || 0}</Text>
                            </div>
                            <ThemeIcon size="xl" radius="md" color="blue" variant="light">
                                <IconChecklist size={24} />
                            </ThemeIcon>
                        </Group>
                    </Paper>

                    <Paper withBorder p="lg" radius="lg">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed">Completion Rate</Text>
                                <Text fw={700} size="28px">{formatPercentage(performanceReport.completionRate)}</Text>
                            </div>
                            <RingProgress
                                size={70}
                                thickness={6}
                                roundCaps
                                sections={[{ value: performanceReport.completionRate || 0, color: 'green' }]}
                                label={
                                    <Text size="xs" ta="center">
                                        {Math.round(performanceReport.completionRate || 0)}%
                                    </Text>
                                }
                            />
                        </Group>
                    </Paper>

                    <Paper withBorder p="lg" radius="lg">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed">Avg Time/Task</Text>
                                <Text fw={700} size="28px">{Math.round(performanceReport.avgTimePerTask || 0)}m</Text>
                            </div>
                            <ThemeIcon size="xl" radius="md" color="yellow" variant="light">
                                <IconClock size={24} />
                            </ThemeIcon>
                        </Group>
                    </Paper>

                    <Paper withBorder p="lg" radius="lg">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed">Rating</Text>
                                <Text fw={700} size="28px">{performanceReport.rating || 'N/A'}</Text>
                                <Text size="xs" c="dimmed">/ 5.0</Text>
                            </div>
                            <ThemeIcon size="xl" radius="md" color="violet" variant="light">
                                <IconStar size={24} />
                            </ThemeIcon>
                        </Group>
                    </Paper>
                </SimpleGrid>

                {/* Tasks Summary */}
                <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Paper withBorder p="lg" radius="lg">
                            <Title order={4} mb="md">Tasks Summary</Title>
                            <Stack>
                                <Group justify="space-between">
                                    <Text>Total Tasks</Text>
                                    <Text fw={700}>{performanceReport.totalTasks || 0}</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text>Completed Tasks</Text>
                                    <Text fw={700}>{performanceReport.completedTasks || 0}</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text>Completion Rate</Text>
                                    <Badge color="green" size="lg">
                                        {formatPercentage(performanceReport.completionRate)}
                                    </Badge>
                                </Group>
                                <Group justify="space-between">
                                    <Text>Avg Time per Task</Text>
                                    <Text fw={500}>{Math.round(performanceReport.avgTimePerTask || 0)} minutes</Text>
                                </Group>
                            </Stack>
                        </Paper>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Paper withBorder p="lg" radius="lg">
                            <Title order={4} mb="md">Revenue & Penalties</Title>
                            <Stack>
                                <Group justify="space-between">
                                    <Group>
                                        <ThemeIcon color="violet" size="sm" variant="light">
                                            <IconBottle size={14} />
                                        </ThemeIcon>
                                        <Text>Minibar Revenue</Text>
                                    </Group>
                                    <Text fw={700}>{formatCurrency(performanceReport.minibarRevenue)}</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Group>
                                        <ThemeIcon color="red" size="sm" variant="light">
                                            <IconAlertCircle size={14} />
                                        </ThemeIcon>
                                        <Text>Damage Reports</Text>
                                    </Group>
                                    <Text fw={700}>{performanceReport.damageReports || 0}</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text>Total Penalty</Text>
                                    <Text fw={700} c="red">{formatCurrency(performanceReport.damagePenalty)}</Text>
                                </Group>
                            </Stack>
                        </Paper>
                    </Grid.Col>
                </Grid>

                {/* Period Information */}
                <Paper withBorder p="lg" radius="lg">
                    <Group justify="space-between" mb="md">
                        <Group>
                            <ThemeIcon size="lg" color="blue" variant="light">
                                <IconCalendarStats size={20} />
                            </ThemeIcon>
                            <Title order={4}>Period Details</Title>
                        </Group>
                    </Group>

                    <SimpleGrid cols={2}>
                        <Card withBorder>
                            <Text size="sm" c="dimmed">Start Date</Text>
                            <Text fw={600}>{performanceReport.periodStart ? format(new Date(performanceReport.periodStart), 'MMMM d, yyyy') : 'N/A'}</Text>
                        </Card>
                        <Card withBorder>
                            <Text size="sm" c="dimmed">End Date</Text>
                            <Text fw={600}>{performanceReport.periodEnd ? format(new Date(performanceReport.periodEnd), 'MMMM d, yyyy') : 'N/A'}</Text>
                        </Card>
                    </SimpleGrid>
                </Paper>
            </Stack>
        </Container>
    );
}