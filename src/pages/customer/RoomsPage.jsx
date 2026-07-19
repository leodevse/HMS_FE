import {useEffect, useState} from 'react';
import {
    Badge,
    Box,
    Button,
    Card,
    Container,
    Grid,
    Group,
    Image,
    LoadingOverlay,
    Pagination,
    Rating,
    Select,
    Stack,
    Text,
    Title
} from '@mantine/core';
import {DateTimePicker} from '@mantine/dates';
import dayjs from 'dayjs';
import {IconChevronRight, IconUsers} from '@tabler/icons-react';
import {useNavigate} from 'react-router-dom';
import {getRoomClassList} from '../../apis/customer/roomClassApi';
import {getMinimumCheckOut} from '../../utils/hotelStayPolicy';

export default function RoomsPage() {
    const navigate = useNavigate();

    const [rooms, setRooms] = useState([]);
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(null);

    const [checkIn, setCheckIn] = useState(dayjs().hour(14).minute(0).second(0).millisecond(0).toDate());
    const [checkOut, setCheckOut] = useState(dayjs().add(1, 'day').hour(12).minute(0).second(0).millisecond(0).toDate());
    const [sortBy, setSortBy] = useState('default');

    const fetchRooms = async (currentPage = 0, size = pageSize, inDate = checkIn, outDate = checkOut, currentSort = sortBy) => {
        setLoading(true);
        setError(null);
        try {
            const inIso = inDate ? dayjs(inDate).format('YYYY-MM-DDTHH:mm:ss') : null;
            const outIso = outDate ? dayjs(outDate).format('YYYY-MM-DDTHH:mm:ss') : null;

            if (inIso && outIso && (dayjs(outIso).isBefore(dayjs(inIso)) || dayjs(outIso).isSame(dayjs(inIso)))) {
                setError('Check-out time must be after check-in time.');
                setLoading(false);
                return;
            }

            const data = await getRoomClassList(currentPage, size, inIso, outIso, currentSort === 'default' ? null : currentSort);
            if (data && data.data) {
                setRooms(data.data);
                setTotalPages(data.totalPages);
                setTotalItems(data.totalItems);
                if (data.pageSize) {
                    const backendSize = Number(data.pageSize);
                    if (backendSize !== pageSize) {
                        setPageSize(backendSize);
                    }
                }
            } else {
                setRooms([]);
                setTotalPages(0);
                setTotalItems(0);
            }
        } catch (err) {
            console.error('Error fetching room classes:', err);
            setError(err.response?.data?.message || err.message || 'Unable to load room data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms(page, pageSize, checkIn, checkOut, sortBy);
    }, [page, pageSize, sortBy, checkIn, checkOut]);

    // Reset to first page when pageSize changes
    const handlePageSizeChange = (value) => {
        if (value) {
            setPageSize(Number(value));
            setPage(0);
        }
    };

    // Format price to VND
    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {style: 'currency', currency: 'VND'}).format(price);
    };

    return (
            <Box>
                {/* Page Header */}
                <Box style={{backgroundColor: 'var(--mantine-color-blue-9)', color: 'white', padding: '50px 0'}}>
                    <Container size="xl">
                        <Title order={1} mb={10} style={{fontSize: '28px', fontWeight: 700, color: 'white'}}>
                            Room Types
                        </Title>
                        <Text style={{fontSize: '16px', opacity: 0.85}}>
                            Explore our luxury room types
                        </Text>
                    </Container>
                </Box>

                {/* Main Content */}
                <Container size="xl" py={60}>
                    <Grid>
                        {/* Sidebar Filters */}
                        <Grid.Col span={{base: 12, md: 2.5}}>
                            <Box style={{position: 'sticky', top: '20px'}}>
                                <Stack gap="xl">
                                    {/* Search Date Filters */}
                                    <Box>
                                        <Text fw={600} mb="md" style={{fontSize: '16px'}}>Search Filters</Text>

                                        <DateTimePicker
                                                label="Check-in"
                                                placeholder="Select date and time"
                                                value={checkIn}
                                                onChange={(date) => {
                                                    if (!date) return;

                                                    const now = dayjs();
                                                    let newCheckIn = date;

                                                    // Don't allow selecting more than 5 minutes in the past
                                                    if (dayjs(date).isBefore(now.subtract(5, 'minute'))) {
                                                        newCheckIn = now.toDate();
                                                    }

                                                    setCheckIn(newCheckIn);

                                                    // Ensure check-out is at least 1 hour after check-in
                                                    const minCheckOut = getMinimumCheckOut(newCheckIn);
                                                    if (!checkOut || dayjs(checkOut).isBefore(minCheckOut)) {
                                                        setCheckOut(minCheckOut);
                                                    }
                                                }}
                                                minDate={new Date()}
                                                mb="sm"
                                                clearable={false}
                                                valueFormat="HH:mm DD/MM/YYYY"
                                        />

                                        <DateTimePicker
                                                label="Check-out"
                                                placeholder="Select date and time"
                                                value={checkOut}
                                                onChange={(date) => {
                                                    if (!date) return;

                                                    const minCheckOut = getMinimumCheckOut(checkIn);
                                                    if (dayjs(date).isBefore(minCheckOut)) {
                                                        setCheckOut(minCheckOut);
                                                    } else {
                                                        setCheckOut(date);
                                                    }
                                                }}
                                                minDate={checkIn ? getMinimumCheckOut(checkIn) : new Date()}
                                                mb="md"
                                                clearable={false}
                                                valueFormat="HH:mm DD/MM/YYYY"
                                        />

                                        <Button
                                                fullWidth
                                                color="blue"
                                                mb="sm"
                                                onClick={() => {
                                                    setPage(0);
                                                    fetchRooms(0, pageSize, checkIn, checkOut);
                                                }}
                                        >
                                            Find rooms
                                        </Button>

                                        <Button
                                                variant="light"
                                                color="gray"
                                                fullWidth
                                                onClick={() => {
                                                    const defaultIn = dayjs().toDate();
                                                    const defaultOut = dayjs().add(1, 'day').hour(12).minute(0).second(0).millisecond(0).toDate();
                                                    setCheckIn(defaultIn);
                                                    setCheckOut(defaultOut);
                                                    setSortBy('default');
                                                    setPage(0);
                                                    fetchRooms(0, pageSize, defaultIn, defaultOut, 'default');
                                                }}
                                        >
                                            Reset
                                        </Button>
                                    </Box>
                                </Stack>
                            </Box>
                        </Grid.Col>

                        {/* Room Grid */}
                        <Grid.Col span={{base: 12, md: 9.5}}>
                            <Box style={{position: 'relative', minHeight: '200px'}}>
                                <LoadingOverlay visible={isLoading} zIndex={1000}
                                                overlayProps={{radius: 'sm', blur: 2}}/>

                                <Group justify="space-between" align="flex-end" mb="lg">
                                    <Text size="md" fw={500} style={{paddingBottom: '8px'}}>
                                        Found {totalItems} room types
                                    </Text>
                                    <Group gap="md">
                                        <Select
                                                label="Price:"
                                                placeholder="Select order"
                                                value={sortBy}
                                                onChange={(val) => {
                                                    setSortBy(val);
                                                    setPage(0);
                                                }}
                                                data={[
                                                    {value: 'default', label: 'Default'},
                                                    {value: 'price_asc', label: 'Price: Low to High'},
                                                    {value: 'price_desc', label: 'Price: High to Low'},
                                                ]}
                                                style={{width: '180px'}}
                                                allowDeselect={false}
                                        />
                                        <Select
                                                label="Page size:"
                                                value={pageSize ? pageSize.toString() : ''}
                                                placeholder="Loading..."
                                                onChange={handlePageSizeChange}
                                                data={['3', '6', '9', '12']}
                                                style={{width: '100px'}}
                                                allowDeselect={false}
                                        />
                                    </Group>
                                </Group>

                                {error && (
                                        <Text c="red" ta="center" my="lg">{error}</Text>
                                )}

                                {!isLoading && !error && rooms.length === 0 && (
                                        <Text ta="center" my="xl" size="lg" c="dimmed">
                                            No matching room types found.
                                        </Text>
                                )}

                                <Grid>
                                    {rooms.map((room) => (
                                            <Grid.Col key={room.id} span={{base: 12, sm: 6, md: 4}}>
                                                <Card
                                                        shadow="sm"
                                                        padding="0"
                                                        radius="md"
                                                        withBorder
                                                        style={{
                                                            height: '100%',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                                            cursor: 'pointer'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.transform = 'translateY(-8px)';
                                                            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = '';
                                                        }}
                                                        onClick={() => navigate(`/user/rooms/${room.id}`)}
                                                >
                                                    {/* Room Image (Base64 from backend) */}
                                                    <Card.Section>
                                                        <Image
                                                                src={room.primaryImage?.dataUrl || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=500'}
                                                                height={220}
                                                                alt={room.name}
                                                                style={{objectFit: 'cover'}}
                                                                fallbackSrc="https://placehold.co/300x220?text=No+Image"
                                                        />
                                                    </Card.Section>

                                                    <Stack p="md" gap="xs" style={{flex: 1}}>
                                                        {/* Room name & total rooms badge */}
                                                        <Group justify="space-between" align="start">
                                                            <Title order={3} fw={600}
                                                                   style={{fontSize: '16px', flex: 1}}>
                                                                {room.name}
                                                            </Title>
                                                            <Badge variant="light"
                                                                   color={room.totalRooms > 0 ? "green" : "red"}
                                                                   radius="sm" style={{flexShrink: 0}}>
                                                                {room.totalRooms} rooms available
                                                            </Badge>
                                                        </Group>

                                                        {/* Average Rating */}
                                                        <Group gap={6}>
                                                            <Rating
                                                                    value={room.averageRating || 0}
                                                                    fractions={2}
                                                                    readOnly
                                                                    size="xs"
                                                                    color="yellow"
                                                            />
                                                            <Text size="xs" c="dimmed">
                                                                {room.averageRating
                                                                        ? room.averageRating.toFixed(1)
                                                                        : 'No reviews yet'}
                                                            </Text>
                                                        </Group>

                                                        {/* Capacity */}
                                                        <Group gap="xs">
                                                            <IconUsers size={15} color="var(--mantine-color-blue-6)"/>
                                                            <Text size="sm" c="dimmed">
                                                                {room.standardCapacity} standard guests
                                                            </Text>
                                                        </Group>

                                                        <Box mt="auto">
                                                            <Group justify="space-between" mb="xs" align="flex-end">
                                                                <Box>
                                                                    <Text fw={700} color="blue.6"
                                                                          style={{fontSize: '18px'}}>
                                                                        {formatPrice(room.basePrice || 0)}
                                                                    </Text>
                                                                    <Text c="dimmed" style={{fontSize: '12px'}}>/
                                                                        night</Text>
                                                                </Box>
                                                            </Group>

                                                            <Stack gap="xs">
                                                                <Button
                                                                        fullWidth
                                                                        color="blue"
                                                                        style={{
                                                                            fontSize: '14px',
                                                                            padding: '8px 16px',
                                                                            fontWeight: 500
                                                                        }}
                                                                        rightSection={<IconChevronRight size={16}/>}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigate(`/user/rooms/${room.id}`);
                                                                        }}
                                                                >
                                                                    View Details
                                                                </Button>
                                                            </Stack>
                                                        </Box>
                                                    </Stack>
                                                </Card>
                                            </Grid.Col>
                                    ))}
                                </Grid>
                            </Box>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                    <Box mt={40} style={{display: 'flex', justifyContent: 'center'}}>
                                        <Pagination
                                                total={totalPages}
                                                value={page + 1}
                                                onChange={(p) => setPage(p - 1)}
                                                color="blue"
                                                size="lg"
                                        />
                                    </Box>
                            )}
                        </Grid.Col>
                    </Grid>
                </Container>
            </Box>
    );
}
