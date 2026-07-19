// src/pages/customer/MyReviewsPage.jsx
import { useState, useEffect } from 'react';
import {
    Container,
    Title,
    Text,
    Paper,
    Stack,
    Group,
    Badge,
    Button,
    Loader,
    Center,
    Grid,
    Card,
    Rating,
    Avatar,
    Divider,
    Alert,
    Pagination,
    Select,
    Modal,
    Textarea,
    ActionIcon,
    Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconStar,
    IconCalendar,
    IconDoor,
    IconEdit,
    IconTrash,
    IconRefresh,
    IconAlertCircle,
    IconArrowLeft
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../../apis/customerApi.js';

export default function MyReviewsPage() {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState(null);
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
    const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
    const [editData, setEditData] = useState({ rating: 0, comment: '' });
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const response = await customerApi.getMyReviews();
            if (Array.isArray(response.data)) {
                setReviews(response.data);
            } else if (response.data && response.data.data) {
                setReviews(response.data.data);
            } else {
                setReviews([]);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to load reviews',
                color: 'red'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (review) => {
        setSelectedReview(review);
        setEditData({
            rating: review.rating,
            comment: review.comment || ''
        });
        openEditModal();
    };

    const handleEditSubmit = async () => {
        if (editData.rating === 0) {
            notifications.show({
                title: 'Error',
                message: 'Please select a rating',
                color: 'red'
            });
            return;
        }

        try {
            await customerApi.updateReview(selectedReview.id, {
                rating: editData.rating,
                comment: editData.comment
            });

            notifications.show({
                title: 'Success',
                message: 'Review updated successfully',
                color: 'green'
            });

            fetchReviews();
            closeEditModal();
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to update review',
                color: 'red'
            });
        }
    };

    const handleDeleteClick = (review) => {
        setSelectedReview(review);
        openDeleteModal();
    };

    const handleDeleteConfirm = async () => {
        try {
            await customerApi.deleteReview(selectedReview.id);

            notifications.show({
                title: 'Success',
                message: 'Review deleted successfully',
                color: 'green'
            });

            fetchReviews();
            closeDeleteModal();
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete review',
                color: 'red'
            });
        }
    };

    const getSortedReviews = () => {
        const sorted = [...reviews];
        switch(sortBy) {
            case 'newest':
                return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'oldest':
                return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case 'highest':
                return sorted.sort((a, b) => b.rating - a.rating);
            case 'lowest':
                return sorted.sort((a, b) => a.rating - b.rating);
            default:
                return sorted;
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

    const sortedReviews = getSortedReviews();
    const totalPages = Math.ceil(sortedReviews.length / itemsPerPage);
    const paginatedReviews = sortedReviews.slice(
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
                    <Group>
                        <Button
                            variant="subtle"
                            leftSection={<IconArrowLeft size={16} />}
                            onClick={() => navigate('/user/bookings')}
                        >
                            Back to Bookings
                        </Button>
                        <Title order={1}>My Reviews</Title>
                    </Group>
                    <Group>
                        <Select
                            value={sortBy}
                            onChange={setSortBy}
                            data={[
                                { value: 'newest', label: 'Newest First' },
                                { value: 'oldest', label: 'Oldest First' },
                                { value: 'highest', label: 'Highest Rating' },
                                { value: 'lowest', label: 'Lowest Rating' }
                            ]}
                            w={180}
                        />
                        <Button
                            leftSection={<IconRefresh size={16} />}
                            variant="light"
                            onClick={fetchReviews}
                        >
                            Refresh
                        </Button>
                    </Group>
                </Group>

                {/* Stats Summary */}
                {reviews.length > 0 && (
                    <Paper withBorder p="md" radius="md">
                        <Group justify="space-around">
                            <div>
                                <Text size="xs" c="dimmed">Total Reviews</Text>
                                <Text fw={700} size="xl">{reviews.length}</Text>
                            </div>
                            <div>
                                <Text size="xs" c="dimmed">Average Rating</Text>
                                <Group gap="xs">
                                    <Rating
                                        value={reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length}
                                        fractions={2}
                                        readOnly
                                    />
                                    <Text fw={700} size="xl">
                                        {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                                    </Text>
                                </Group>
                            </div>
                            <div>
                                <Text size="xs" c="dimmed">5-Star Reviews</Text>
                                <Text fw={700} size="xl">
                                    {reviews.filter(r => r.rating === 5).length}
                                </Text>
                            </div>
                        </Group>
                    </Paper>
                )}

                {/* Reviews Grid */}
                {paginatedReviews.length === 0 ? (
                    <Paper withBorder p="xl" radius="md">
                        <Center>
                            <Stack align="center" gap="md">
                                <IconStar size={48} color="gray" />
                                <Title order={3}>No reviews yet</Title>
                                <Text c="dimmed" ta="center">
                                    You haven't written any reviews yet.
                                    Complete your stays and share your experience!
                                </Text>
                                <Button
                                    variant="light"
                                    onClick={() => navigate('/user/bookings')}
                                >
                                    View Your Bookings
                                </Button>
                            </Stack>
                        </Center>
                    </Paper>
                ) : (
                    <>
                        <Grid>
                            {paginatedReviews.map((review) => (
                                <Grid.Col key={review.id} span={{ base: 12, md: 6 }}>
                                    <Card withBorder radius="md" padding="lg">
                                        <Stack>
                                            <Group justify="space-between">
                                                <Group>
                                                    <Avatar color="blue" radius="xl">
                                                        {review.bookingCode?.charAt(0) || 'R'}
                                                    </Avatar>
                                                    <div>
                                                        <Text fw={500}>Booking {review.bookingCode}</Text>
                                                        <Group gap="xs">
                                                            <IconDoor size={14} />
                                                            <Text size="sm" c="dimmed">
                                                                {review.roomType} - Room {review.roomNumber}
                                                            </Text>
                                                        </Group>
                                                    </div>
                                                </Group>
                                                <Badge color="blue" variant="light">
                                                    {formatDate(review.createdAt)}
                                                </Badge>
                                            </Group>

                                            <Divider />

                                            <div>
                                                <Group mb="xs">
                                                    <Rating value={review.rating} readOnly />
                                                    <Text fw={600}>{review.rating}/5</Text>
                                                </Group>
                                                <Paper withBorder p="sm" bg="gray.0" radius="md">
                                                    <Text size="sm" style={{ fontStyle: review.comment ? 'normal' : 'italic' }}>
                                                        {review.comment || 'No written review provided'}
                                                    </Text>
                                                </Paper>
                                            </div>

                                            <Group justify="space-between" mt="md">
                                                <Group gap="xs">
                                                    <Badge color="green" variant="light">
                                                        Verified Stay
                                                    </Badge>
                                                </Group>
                                                <Group gap="xs">
                                                    <Tooltip label="Edit Review">
                                                        <ActionIcon
                                                            size="md"
                                                            color="blue"
                                                            variant="light"
                                                            onClick={() => handleEditClick(review)}
                                                        >
                                                            <IconEdit size={18} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    <Tooltip label="Delete Review">
                                                        <ActionIcon
                                                            size="md"
                                                            color="red"
                                                            variant="light"
                                                            onClick={() => handleDeleteClick(review)}
                                                        >
                                                            <IconTrash size={18} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Group>
                                            </Group>
                                        </Stack>
                                    </Card>
                                </Grid.Col>
                            ))}
                        </Grid>

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

                {/* Edit Modal */}
                <Modal
                    opened={editModalOpened}
                    onClose={closeEditModal}
                    title="Edit Your Review"
                    size="lg"
                    centered
                >
                    <Stack>
                        {selectedReview && (
                            <Paper withBorder p="md" bg="gray.0">
                                <Text size="sm"><strong>Booking:</strong> {selectedReview.bookingCode}</Text>
                                <Text size="sm"><strong>Room:</strong> {selectedReview.roomType} - {selectedReview.roomNumber}</Text>
                            </Paper>
                        )}

                        <Text fw={500}>How would you rate your stay?</Text>
                        <Rating
                            size="xl"
                            value={editData.rating}
                            onChange={(value) => setEditData({...editData, rating: value})}
                            color="yellow"
                        />

                        <Textarea
                            label="Your Review"
                            placeholder="Share your experience with us..."
                            value={editData.comment}
                            onChange={(e) => setEditData({...editData, comment: e.target.value})}
                            minRows={4}
                            autosize
                        />

                        <Group justify="flex-end" mt="md">
                            <Button variant="light" onClick={closeEditModal}>
                                Cancel
                            </Button>
                            <Button color="blue" onClick={handleEditSubmit}>
                                Update Review
                            </Button>
                        </Group>
                    </Stack>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal
                    opened={deleteModalOpened}
                    onClose={closeDeleteModal}
                    title="Delete Review"
                    size="md"
                    centered
                >
                    <Stack>
                        <Alert color="red" icon={<IconAlertCircle size={16} />}>
                            Are you sure you want to delete this review? This action cannot be undone.
                        </Alert>

                        {selectedReview && (
                            <Paper withBorder p="sm" bg="gray.0">
                                <Text size="sm"><strong>Booking:</strong> {selectedReview.bookingCode}</Text>
                                <Text size="sm"><strong>Rating:</strong> {selectedReview.rating}/5</Text>
                                {selectedReview.comment && (
                                    <Text size="sm"><strong>Comment:</strong> {selectedReview.comment}</Text>
                                )}
                            </Paper>
                        )}

                        <Group justify="flex-end" mt="md">
                            <Button variant="light" onClick={closeDeleteModal}>
                                Cancel
                            </Button>
                            <Button color="red" onClick={handleDeleteConfirm}>
                                Delete Review
                            </Button>
                        </Group>
                    </Stack>
                </Modal>
            </Stack>
        </Container>
    );
}