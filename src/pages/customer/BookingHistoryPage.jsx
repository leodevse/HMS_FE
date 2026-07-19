// src/pages/customer/BookingHistoryPage.jsx
import { useState, useEffect } from 'react';
import {
    Container,
    Title,
    Text,
    Paper,
    Stack,
    Group,
    Tabs,
    Badge,
    Button,
    Select,
    TextInput,
    Loader,
    Center,
    Pagination,
    Table,
    ActionIcon,
    Tooltip,
    Modal,
    Textarea,
    Alert,
    Rating
} from '@mantine/core';
import {
    IconCalendarStats,
    IconSearch,
    IconRefresh,
    IconEye,
    IconTrash,
    IconAlertCircle,
    IconStar,
    IconStarFilled
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../../apis/customerApi.js';

const statusColors = {
    'PENDING_DEPOSIT': 'yellow',
    'CONFIRMED': 'blue',
    'IN_HOUSE': 'teal',
    'CHECKED_OUT': 'green',
    'FINISHED': 'green',
    'CANCELLED': 'red'
};

const statusLabels = {
    'PENDING_DEPOSIT': 'Pending',
    'CONFIRMED': 'Confirmed',
    'IN_HOUSE': 'In House',
    'CHECKED_OUT': 'Completed',
    'FINISHED': 'Finished',
    'CANCELLED': 'Cancelled'
};

const CANCELLABLE_STATUSES = ['PENDING_DEPOSIT', 'CONFIRMED'];

export default function BookingHistoryPage() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [modalOpened, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);
    const [cancelModalOpened, { open: openCancelModal, close: closeCancelModal }] = useDisclosure(false);
    const [reviewModalOpened, { open: openReviewModal, close: closeReviewModal }] = useDisclosure(false);
    const [cancelReason, setCancelReason] = useState('');
    const [reviewData, setReviewData] = useState({
        rating: 0,
        comment: ''
    });
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        console.log('Bookings from API:', bookings);
        console.log('HasReviewed values:', bookings.map(b => ({id: b.id, hasReviewed: b.hasReviewed})));

        if (!bookings || bookings.length === 0) {
            setFilteredBookings([]);
            return;
        }

        let filtered = [...bookings];

        // Filter by tab
        if (activeTab !== 'all') {
            const statusMap = {
                'pending': 'PENDING_DEPOSIT',
                'confirmed': 'CONFIRMED',
                'inhouse': 'IN_HOUSE',
                'finished': 'FINISHED',
                'cancelled': 'CANCELLED'
            };

            const targetStatus = statusMap[activeTab];
            if (targetStatus) {
                filtered = filtered.filter(booking => booking.status === targetStatus);
            }
        }

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(booking =>
                booking.code?.toLowerCase().includes(query) ||
                booking.roomNumber?.toLowerCase().includes(query) ||
                booking.roomType?.toLowerCase().includes(query)
            );
        }

        filtered.sort((a, b) => {
            switch(sortBy) {
                case 'newest':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'checkin':
                    return new Date(b.checkIn) - new Date(a.checkIn);
                case 'price':
                    return b.totalPrice - a.totalPrice;
                default:
                    return 0;
            }
        });

        setFilteredBookings(filtered);
        setCurrentPage(1);
    }, [bookings, activeTab, searchQuery, sortBy]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const response = await customerApi.getBookingHistory();

            if (Array.isArray(response.data)) {
                setBookings(response.data);
            } else if (Array.isArray(response.data?.content)) {
                setBookings(response.data.content);
            } else if (response.data && response.data.data) {
                setBookings(response.data.data);
            } else {
                setBookings([]);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to load booking history',
                color: 'red'
            });
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (booking) => {
        navigate(`/user/bookings/${booking.id}`);
    };

    const handleCancelClick = (booking) => {
        if (!CANCELLABLE_STATUSES.includes(booking.status)) {
            notifications.show({
                title: 'Cannot Cancel',
                message: `Bookings with status "${statusLabels[booking.status]}" cannot be cancelled`,
                color: 'red'
            });
            return;
        }
        setSelectedBooking(booking);
        openCancelModal();
    };

    const handleReviewClick = (booking) => {
        setSelectedBooking(booking);
        setReviewData({ rating: 0, comment: '' });
        openReviewModal();
    };

    const handleReviewSubmit = async () => {
        if (reviewData.rating === 0) {
            notifications.show({
                title: 'Error',
                message: 'Please select a rating',
                color: 'red'
            });
            return;
        }

        try {
            await customerApi.submitReview({
                bookingId: selectedBooking.id,
                rating: reviewData.rating,
                comment: reviewData.comment
            });

            notifications.show({
                title: 'Success',
                message: 'Thank you for your review!',
                color: 'green'
            });

            closeReviewModal();
            fetchBookings(); // FETCH LẠI DỮ LIỆU TỪ API
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to submit review',
                color: 'red'
            });
        }
    };

    const handleCancelConfirm = async () => {
        if (!cancelReason.trim()) {
            notifications.show({
                title: 'Error',
                message: 'Please provide a reason for cancellation',
                color: 'red'
            });
            return;
        }

        try {
            await customerApi.cancelBooking(selectedBooking.id, { reason: cancelReason });
            notifications.show({
                title: 'Success',
                message: 'Booking cancelled successfully',
                color: 'green'
            });
            fetchBookings();
            closeCancelModal();
            setCancelReason('');
            setSelectedBooking(null);
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to cancel booking',
                color: 'red'
            });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        if (!amount) return 'VND 0';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const isCancellable = (status) => CANCELLABLE_STATUSES.includes(status);

    const canReview = (booking) => {
        return booking.status === 'FINISHED' && !booking.hasReviewed;
    };

    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const paginatedBookings = filteredBookings.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading) {
        return (
            <Center style={{ height: '60vh' }}>
                <Loader size="xl" />
            </Center>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <Group justify="space-between" align="center">
                    <div>
                        <Title order={1}>Booking History</Title>
                        <Text c="dimmed" size="sm">
                            View and manage all your past and upcoming bookings
                        </Text>
                    </div>
                    <Button
                        leftSection={<IconRefresh size={16} />}
                        variant="light"
                        onClick={fetchBookings}
                    >
                        Refresh
                    </Button>
                </Group>

                {/* Cancellation Policy Alert */}
                <Alert color="blue" title="Cancellation Policy" icon={<IconAlertCircle />}>
                    <Text size="sm">
                        • Bookings with status <strong>PENDING</strong> or <strong>CONFIRMED</strong> can be cancelled.
                    </Text>
                    <Text size="sm">
                        • <strong>FINISHED</strong> bookings can be reviewed (one review per booking).
                    </Text>
                </Alert>

                {/* Filters */}
                <Paper withBorder p="md" radius="md">
                    <Stack>
                        <Group justify="space-between">
                            <Tabs value={activeTab} onChange={setActiveTab}>
                                <Tabs.List>
                                    <Tabs.Tab value="all">All Bookings</Tabs.Tab>
                                    <Tabs.Tab value="pending">Pending</Tabs.Tab>
                                    <Tabs.Tab value="confirmed">Confirmed</Tabs.Tab>
                                    <Tabs.Tab value="inhouse">In House</Tabs.Tab>
                                    <Tabs.Tab value="finished">Finished</Tabs.Tab>
                                    <Tabs.Tab value="cancelled">Cancelled</Tabs.Tab>
                                </Tabs.List>
                            </Tabs>

                            <Group>
                                <Select
                                    value={sortBy}
                                    onChange={setSortBy}
                                    data={[
                                        { value: 'newest', label: 'Newest First' },
                                        { value: 'oldest', label: 'Oldest First' },
                                        { value: 'checkin', label: 'Check-in Date' },
                                        { value: 'price', label: 'Price' }
                                    ]}
                                    w={180}
                                />
                                <TextInput
                                    placeholder="Search bookings..."
                                    leftSection={<IconSearch size={16} />}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    w={250}
                                />
                            </Group>
                        </Group>
                    </Stack>
                </Paper>

                {/* Bookings Table */}
                {filteredBookings.length === 0 ? (
                    <Paper withBorder p="xl" radius="md">
                        <Center>
                            <Stack align="center" gap="md">
                                <IconCalendarStats size={48} color="gray" />
                                <Title order={3}>No bookings found</Title>
                                <Text c="dimmed" ta="center">
                                    {searchQuery || activeTab !== 'all'
                                        ? 'Try adjusting your filters'
                                        : 'You haven\'t made any bookings yet'}
                                </Text>
                                {!searchQuery && activeTab === 'all' && (
                                    <Button
                                        variant="light"
                                        onClick={() => window.location.href = '/user/rooms'}
                                    >
                                        Browse Rooms
                                    </Button>
                                )}
                            </Stack>
                        </Center>
                    </Paper>
                ) : (
                    <>
                        <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Booking Code</Table.Th>
                                        <Table.Th>Room</Table.Th>
                                        <Table.Th>Check In</Table.Th>
                                        <Table.Th>Check Out</Table.Th>
                                        <Table.Th>Total Price</Table.Th>
                                        <Table.Th>Status</Table.Th>
                                        <Table.Th>Review</Table.Th>
                                        <Table.Th>Actions</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {paginatedBookings.map((booking) => (
                                        <Table.Tr key={booking.id}>
                                            <Table.Td>
                                                <Text fw={500} size="sm">{booking.code}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">
                                                    {booking.roomType || 'N/A'}
                                                    {booking.roomNumber && ` - ${booking.roomNumber}`}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">{formatDate(booking.checkIn)}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">{formatDate(booking.checkOut)}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" fw={500} c="blue">
                                                    {formatCurrency(booking.totalPrice)}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge
                                                    color={statusColors[booking.status] || 'gray'}
                                                    variant="light"
                                                    size="sm"
                                                >
                                                    {statusLabels[booking.status] || booking.status}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                {booking.status === 'FINISHED' && (
                                                    booking.hasReviewed ? (
                                                        <Badge color="green" variant="light" size="sm">
                                                            <Group gap={4}>
                                                                <IconStarFilled size={12} />
                                                                <span>Reviewed</span>
                                                            </Group>
                                                        </Badge>
                                                    ) : (
                                                        <Button
                                                            size="xs"
                                                            color="yellow"
                                                            variant="light"
                                                            leftSection={<IconStar size={14} />}
                                                            onClick={() => handleReviewClick(booking)}
                                                        >
                                                            Review
                                                        </Button>
                                                    )
                                                )}
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    <Tooltip label="View Details">
                                                        <ActionIcon
                                                            color="blue"
                                                            onClick={() => handleViewDetails(booking)}
                                                            variant="light"
                                                        >
                                                            <IconEye size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>

                                                    {isCancellable(booking.status) && (
                                                        <Tooltip label="Cancel Booking">
                                                            <ActionIcon
                                                                color="red"
                                                                onClick={() => handleCancelClick(booking)}
                                                                variant="light"
                                                            >
                                                                <IconTrash size={16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    )}
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Paper>

                        {totalPages > 1 && (
                            <Group justify="center" mt="md">
                                <Pagination
                                    total={totalPages}
                                    value={currentPage}
                                    onChange={setCurrentPage}
                                    size="md"
                                    radius="md"
                                />
                            </Group>
                        )}
                    </>
                )}

                {/* Review Modal */}
                <Modal
                    opened={reviewModalOpened}
                    onClose={closeReviewModal}
                    title={`Review Your Stay - ${selectedBooking?.code}`}
                    size="lg"
                    centered
                >
                    <Stack>
                        {selectedBooking && (
                            <Paper withBorder p="md" bg="gray.0">
                                <Text size="sm"><strong>Room:</strong> {selectedBooking.roomType} {selectedBooking.roomNumber}</Text>
                                <Text size="sm"><strong>Stay:</strong> {formatDate(selectedBooking.checkIn)} - {formatDate(selectedBooking.checkOut)}</Text>
                            </Paper>
                        )}

                        <Text fw={500}>How would you rate your stay?</Text>
                        <Rating
                            size="xl"
                            value={reviewData.rating}
                            onChange={(value) => setReviewData({...reviewData, rating: value})}
                            color="yellow"
                        />

                        <Textarea
                            label="Your Review"
                            placeholder="Share your experience with us..."
                            value={reviewData.comment}
                            onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
                            minRows={4}
                            autosize
                        />

                        <Group justify="flex-end" mt="md">
                            <Button variant="light" onClick={closeReviewModal}>
                                Cancel
                            </Button>
                            <Button color="yellow" onClick={handleReviewSubmit}>
                                Submit Review
                            </Button>
                        </Group>
                    </Stack>
                </Modal>

                {/* Cancel Confirmation Modal */}
                <Modal
                    opened={cancelModalOpened}
                    onClose={closeCancelModal}
                    title="Cancel Booking"
                    size="md"
                    centered
                >
                    <Stack>
                        <Text size="sm" fw={500}>Are you sure you want to cancel this booking?</Text>

                        {selectedBooking && (
                            <Paper withBorder p="sm" bg="gray.0">
                                <Text size="sm"><strong>Booking Code:</strong> {selectedBooking.code}</Text>
                                <Text size="sm"><strong>Room:</strong> {selectedBooking.roomType} {selectedBooking.roomNumber}</Text>
                                <Text size="sm"><strong>Check-in:</strong> {formatDate(selectedBooking.checkIn)}</Text>
                                <Text size="sm"><strong>Check-out:</strong> {formatDate(selectedBooking.checkOut)}</Text>
                            </Paper>
                        )}

                        <Textarea
                            label="Cancellation Reason"
                            placeholder="Please provide a reason for cancellation..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            required
                            minRows={3}
                        />

                        <Group justify="flex-end" mt="md">
                            <Button variant="light" onClick={closeCancelModal}>
                                Keep Booking
                            </Button>
                            <Button color="red" onClick={handleCancelConfirm}>
                                Yes, Cancel Booking
                            </Button>
                        </Group>
                    </Stack>
                </Modal>
            </Stack>
        </Container>
    );
}
