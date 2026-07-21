import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Grid, Box, Text, Title, Image, Group, Stack, Button,
    Card, Badge, Tabs, Loader, Center, Pagination, Textarea, Rating, Avatar, TextInput, Select,
    Breadcrumbs, Anchor
} from '@mantine/core';
import { IconUsers, IconCoin, IconChevronRight, IconBed, IconChevronLeft } from '@tabler/icons-react';
import { getRoomClassDetail, getOtherRoomClasses } from '../../apis/customer/roomClassApi';
import { getRoomClassRatings } from '../../apis/customer/ratingApi';

export default function RoomDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [activeImage, setActiveImage] = useState(0);
    const [roomData, setRoomData] = useState(null);
    const [otherRooms, setOtherRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [otherLoading, setOtherLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedRatingFilter, setSelectedRatingFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState('5');
    const [ratingData, setRatingData] = useState(null);
    const [ratingLoading, setRatingLoading] = useState(false);

    useEffect(() => {
        if (!id) return;

        // Fetch chi tiết loại phòng
        const fetchDetail = async () => {
            try {
                setLoading(true);
                const data = await getRoomClassDetail(id);
                setRoomData(data);
            } catch (error) {
                console.error('Error fetching room class detail:', error);
                setRoomData(null);
            } finally {
                setLoading(false);
            }
        };

        // Fetch danh sách loại phòng khác
        const fetchOthers = async () => {
            try {
                setOtherLoading(true);
                const data = await getOtherRoomClasses(id);
                // data là mảng RoomClassResponse[]
                setOtherRooms(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error fetching other room classes:', error);
                setOtherRooms([]);
            } finally {
                setOtherLoading(false);
            }
        };

        fetchDetail();
        fetchOthers();
    }, [id]);

    // Fetch rating stats (count, average) ngay khi trang load để hiển thị trên header
    useEffect(() => {
        if (!id) return;
        const fetchRatingStats = async () => {
            try {
                const data = await getRoomClassRatings(id, 0, 1, null);
                setRatingData(prev => ({
                    ...prev,
                    averageRating: data.averageRating,
                    totalReviews: data.totalReviews,
                    ratingDistribution: data.ratingDistribution,
                }));
            } catch (error) {
                console.error('Error fetching rating stats:', error);
            }
        };
        fetchRatingStats();
    }, [id]);

    // Fetch danh sách review khi tab Đánh giá được mở hoặc filter/page thay đổi
    useEffect(() => {
        if (!id || activeTab !== 'reviews') return;
        const fetchRatings = async () => {
            try {
                setRatingLoading(true);
                const ratingFilterValue = selectedRatingFilter === 'all' ? null : selectedRatingFilter;
                const data = await getRoomClassRatings(id, currentPage, parseInt(pageSize), ratingFilterValue);
                setRatingData(data);
                // Đồng bộ pageSize từ backend nếu backend trả về khác với state hiện tại
                if (data.pageSize && String(data.pageSize) !== String(pageSize)) {
                    setPageSize(String(data.pageSize));
                }
            } catch (error) {
                console.error('Error fetching ratings:', error);
            } finally {
                setRatingLoading(false);
            }
        };
        fetchRatings();
    }, [id, activeTab, currentPage, pageSize, selectedRatingFilter]);

    // Reset active image khi đổi phòng
    useEffect(() => {
        setActiveImage(0);
    }, [id]);

    const formatPrice = (price) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(price || 0);

    // Loading state
    if (loading) {
        return (
            <Center style={{ height: '80vh' }}>
                <Loader size="xl" color="blue" />
            </Center>
        );
    }

    // Not found
    if (!roomData) {
        return (
            <Container size="xl" py={40}>
                <Center>
                    <Stack align="center" gap="md">
                        <Text size="xl" c="dimmed">Room type not found.</Text>
                        <Button
                            onClick={() => navigate('/user/rooms')}
                            color="blue"
                        >
                            Back to rooms list
                        </Button>
                    </Stack>
                </Center>
            </Container>
        );
    }

    // Danh sách ảnh (ảnh primary luôn ở đầu — backend đã sort)
    const images = roomData.images && roomData.images.length > 0
        ? roomData.images.map((img) => img.dataUrl)
        : ['https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800'];

    // Danh sách assets (tiện nghi trong phòng)
    const assets = roomData.assets || [];

    // Lấy data đánh giá
    const roomRating = ratingData?.averageRating || 0;
    const roomReviewsCount = ratingData?.totalReviews || 0;
    const ratingDistribution = ratingData?.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const reviewsList = ratingData?.content || [];

    return (
        <Box>
            <Container size="xl" py={40}>
                {/* ── Breadcrumbs ── */}
                <Breadcrumbs mb="xl" separator={<IconChevronRight size={14} />} style={{ fontSize: '14px' }}>
                    <Anchor onClick={() => navigate('/user/rooms')} style={{ cursor: 'pointer', fontWeight: 500 }}>
                        Room
                    </Anchor>
                    <Text fw={500} color="dimmed">Room Detail</Text>
                </Breadcrumbs>

                {/* ── Image Gallery ── */}
                <Grid gutter="md" mb={40}>
                    {/* Main image */}
                    <Grid.Col span={{ base: 12, md: 8 }}>
                        <Box style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
                            <Image
                                src={images[activeImage]}
                                height={500}
                                alt={roomData.name}
                                style={{ objectFit: 'cover' }}
                                fallbackSrc="https://placehold.co/800x500?text=No+Image"
                            />
                            <Badge
                                style={{
                                    position: 'absolute',
                                    bottom: '16px',
                                    left: '16px',
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    color: 'white',
                                    fontSize: '14px',
                                    padding: '8px 16px'
                                }}
                            >
                                📸 {images.length} photos
                            </Badge>
                        </Box>
                    </Grid.Col>

                    {/* Thumbnail images */}
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Stack gap="md">
                            {images.slice(1, 3).map((img, idx) => (
                                <Box
                                    key={idx}
                                    style={{
                                        position: 'relative',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        border: activeImage === idx + 1 ? '3px solid var(--mantine-color-blue-6)' : '3px solid transparent'
                                    }}
                                    onClick={() => setActiveImage(idx + 1)}
                                >
                                    <Image
                                        src={img}
                                        height={230}
                                        alt={`Photo ${idx + 2}`}
                                        style={{ objectFit: 'cover' }}
                                        fallbackSrc="https://placehold.co/400x230?text=No+Image"
                                    />
                                    {/* "Xem thêm" overlay nếu có nhiều ảnh hơn */}
                                    {idx === 1 && images.length > 3 && (
                                        <Box
                                            style={{
                                                position: 'absolute',
                                                top: 0, left: 0, right: 0, bottom: 0,
                                                background: 'rgba(0,0,0,0.5)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '20px',
                                                fontWeight: 600
                                            }}
                                            onClick={() => setActiveImage(idx + 1)}
                                        >
                                            +{images.length - 3} photos
                                        </Box>
                                    )}
                                </Box>
                            ))}
                        </Stack>
                    </Grid.Col>
                </Grid>

                {/* ── Content + Booking ── */}
                <Grid gutter={40}>
                    {/* Left: details */}
                    <Grid.Col span={{ base: 12, md: 8 }}>
                        {/* Room header */}
                        <Box mb={30}>
                            <Group align="center" mb="xs">
                                <Title order={1} style={{ fontSize: '24px', fontWeight: 700 }}>
                                    {roomData.name}
                                </Title>
                                <Badge size="lg" variant="outline" style={{ fontSize: '12px' }}>
                                    {roomData.totalRooms} rooms
                                </Badge>
                            </Group>
                            {/* Điểm đánh giá trung bình */}
                            <Group gap={8} mb="sm">
                                <Rating
                                    value={roomData.averageRating || 0}
                                    fractions={2}
                                    readOnly
                                    size="md"
                                    color="yellow"
                                />
                                <Text fw={700} style={{ fontSize: '16px' }}>
                                    {roomData.averageRating ? roomData.averageRating.toFixed(1) : '0.0'}
                                </Text>
                                <Text c="dimmed" size="sm">
                                    ({roomReviewsCount} reviews)
                                </Text>
                            </Group>
                        </Box>

                        {/* Tabs */}
                        <Tabs value={activeTab} onChange={setActiveTab} color="blue">
                            <Tabs.List mb={20}>
                                <Tabs.Tab value="overview" style={{ fontSize: '16px', fontWeight: 500 }}>
                                    Overview
                                </Tabs.Tab>
                                <Tabs.Tab value="reviews" style={{ fontSize: '16px', fontWeight: 500 }}>
                                    Reviews
                                </Tabs.Tab>
                            </Tabs.List>

                            {/* Tab: Tổng quan */}
                            <Tabs.Panel value="overview">
                                <Box mb={40}>
                                    <Title order={3} mb={20} style={{ fontSize: '18px', fontWeight: 600 }}>
                                        Room Information
                                    </Title>
                                    <Card padding="lg" radius="md" withBorder style={{ backgroundColor: '#FAFAFA' }}>
                                        <Grid gutter="xl">
                                            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                                                <Box>
                                                    <Group gap="xs" mb={8}>
                                                        <Text style={{ fontSize: '20px' }}>🏨</Text>
                                                        <Text fw={600} c="dimmed" size="sm">Room Type</Text>
                                                    </Group>
                                                    <Text fw={600} style={{ fontSize: '16px' }}>{roomData.name}</Text>
                                                </Box>
                                            </Grid.Col>
                                            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                                                <Box>
                                                    <Group gap="xs" mb={8}>
                                                        <Text style={{ fontSize: '20px' }}>👤</Text>
                                                        <Text fw={600} c="dimmed" size="sm">Standard Capacity</Text>
                                                    </Group>
                                                    <Text fw={600} style={{ fontSize: '16px' }}>{roomData.standardCapacity} guests</Text>
                                                </Box>
                                            </Grid.Col>
                                            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                                                <Box>
                                                    <Group gap="xs" mb={8}>
                                                        <Text style={{ fontSize: '20px' }}>👥</Text>
                                                        <Text fw={600} c="dimmed" size="sm">Max Capacity</Text>
                                                    </Group>
                                                    <Text fw={600} style={{ fontSize: '16px' }}>{roomData.maxCapacity} guests</Text>
                                                </Box>
                                            </Grid.Col>
                                            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                                                <Box>
                                                    <Group gap="xs" mb={8}>
                                                        <Text style={{ fontSize: '20px' }}>💰</Text>
                                                        <Text fw={600} c="dimmed" size="sm">Price per night</Text>
                                                    </Group>
                                                    <Text fw={700} color="blue.6" style={{ fontSize: '18px' }}>
                                                        {formatPrice(roomData.basePrice)}
                                                    </Text>
                                                </Box>
                                            </Grid.Col>
                                            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                                                <Box>
                                                    <Group gap="xs" mb={8}>
                                                        <Text style={{ fontSize: '20px' }}>➕</Text>
                                                        <Text fw={600} c="dimmed" size="sm">Extra person fee</Text>
                                                    </Group>
                                                    <Text fw={600} style={{ fontSize: '16px' }}>
                                                        {formatPrice(roomData.extraPersonFee)}
                                                    </Text>
                                                </Box>
                                            </Grid.Col>
                                            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                                                <Box>
                                                    <Group gap="xs" mb={8}>
                                                        <Text style={{ fontSize: '20px' }}>🚪</Text>
                                                        <Text fw={600} c="dimmed" size="sm">Total rooms</Text>
                                                    </Group>
                                                    <Text fw={600} style={{ fontSize: '16px' }}>{roomData.totalRooms} rooms</Text>
                                                </Box>
                                            </Grid.Col>
                                        </Grid>
                                    </Card>
                                </Box>



                                {/* Tiện nghi */}
                                <Box mt={40} mb={40}>
                                    <Title order={3} mb={24} style={{ fontSize: '18px', fontWeight: 600 }}>
                                        Highlighted Amenities
                                    </Title>
                                    {assets.length === 0 ? (
                                        <Text c="dimmed">No amenity information available.</Text>
                                    ) : (
                                        <Grid gutter="xl">
                                            {assets.map((asset) => (
                                                <Grid.Col key={asset.id} span={{ base: 6, sm: 4 }}>
                                                    <Group gap="sm" wrap="nowrap">
                                                        <Box style={{
                                                            minWidth: '40px',
                                                            height: '40px',
                                                            borderRadius: '10px',
                                                            backgroundColor: 'var(--mantine-color-blue-0)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            <Text style={{ fontSize: '18px' }}>✨</Text>
                                                        </Box>
                                                        <Text fw={500} style={{ fontSize: '15px', color: '#495057' }}>
                                                            {asset.name}
                                                        </Text>
                                                    </Group>
                                                </Grid.Col>
                                            ))}
                                        </Grid>
                                    )}
                                </Box>

                                {/* Chính sách */}
                                <Box mb={40}>
                                    <Title order={3} mb={20} style={{ fontSize: '18px', fontWeight: 600 }}>
                                        Policies
                                    </Title>
                                    <Stack gap="md">
                                        <Box>
                                            <Text fw={600} mb="xs" style={{ fontSize: '16px' }}>Check-in</Text>
                                            <Text c="dimmed" style={{ fontSize: '15px' }}>20 minutes before</Text>
                                        </Box>
                                        <Box>
                                            <Text fw={600} mb="xs" style={{ fontSize: '16px' }}>Check-out</Text>
                                            <Text c="dimmed" style={{ fontSize: '15px' }}>20 minutes before</Text>
                                        </Box>
                                        <Box>
                                            <Text fw={600} mb="xs" style={{ fontSize: '16px' }}>Cancellation</Text>
                                            <Text c="dimmed" style={{ fontSize: '15px' }}>Free cancellation up to 48 hours before</Text>
                                        </Box>
                                        <Box>
                                            <Text fw={600} mb="xs" style={{ fontSize: '16px' }}>Extra person fee</Text>
                                            <Text c="dimmed" style={{ fontSize: '15px' }}>
                                                {formatPrice(roomData.extraPersonFee)} / person over standard ({roomData.standardCapacity} guests)
                                            </Text>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Tabs.Panel>

                            {/* Tab: Đánh giá */}
                            <Tabs.Panel value="reviews">
                                <Box mb={30}>
                                    <Group justify="space-between" mb={20}>
                                        <Title order={3} style={{ fontSize: '18px', fontWeight: 600 }}>
                                            Customer Reviews
                                        </Title>
                                        <Group gap={8}>
                                            <Text fw={700} style={{ fontSize: '20px' }}>{roomRating.toFixed(1)}</Text>
                                            <Box>
                                                <Rating value={roomRating} fractions={2} readOnly size="sm" color="yellow" />
                                                <Text c="dimmed" size="xs">{roomReviewsCount} reviews</Text>
                                            </Box>
                                        </Group>
                                    </Group>

                                    {/* Rating Filter and Page Size */}
                                    <Group justify="space-between" mb={20}>
                                        <Group gap="sm">
                                            <Button
                                                variant={selectedRatingFilter === 'all' ? 'filled' : 'outline'}
                                                size="sm"
                                                onClick={() => setSelectedRatingFilter('all')}
                                                color="blue"
                                            >
                                                All ({roomReviewsCount})
                                            </Button>
                                            {[5, 4, 3, 2, 1].map(star => {
                                                const count = ratingDistribution[star] || 0;
                                                if (count === 0) return null;
                                                return (
                                                    <Button
                                                        key={star}
                                                        variant={selectedRatingFilter === star ? 'filled' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setSelectedRatingFilter(star)}
                                                        color="blue"
                                                    >
                                                        {star} ⭐ ({count})
                                                    </Button>
                                                );
                                            })}
                                        </Group>
                                        <Select
                                            value={pageSize}
                                            onChange={(value) => {
                                                if (value) setPageSize(value);
                                                setCurrentPage(0);
                                            }}
                                            data={['5', '10', '20']}
                                            style={{ width: '130px' }}
                                            leftSectionWidth={0}
                                            allowDeselect={false}
                                        />
                                    </Group>

                                    <Stack gap="lg" style={{ minHeight: '300px' }}>
                                        {ratingLoading ? (
                                            <Center style={{ flex: 1 }}>
                                                <Loader color="blue" />
                                            </Center>
                                        ) : (() => {
                                            return reviewsList.length > 0 ? (
                                                reviewsList.map((review) => (
                                                    <Card key={review.id} padding="lg" radius="md" withBorder>
                                                        <Group mb="sm">
                                                            <Avatar size={40} radius="xl" color="blue">
                                                                {review.avatar}
                                                            </Avatar>
                                                            <Box style={{ flex: 1 }}>
                                                                <Text fw={600} style={{ fontSize: '16px' }}>{review.name}</Text>
                                                                <Text c="dimmed" size="sm">{review.date}</Text>
                                                            </Box>
                                                            <Rating value={review.rating} readOnly size="sm" color="#FFB800" />
                                                        </Group>
                                                        <Text c="dimmed" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                                                            {review.comment}
                                                        </Text>
                                                    </Card>
                                                ))
                                            ) : (
                                                <Card padding="lg" radius="md" withBorder>
                                                    <Text c="dimmed" ta="center" style={{ fontSize: '15px' }}>
                                                        {selectedRatingFilter === 'all'
                                                            ? 'No reviews yet for this room type.'
                                                            : `No ${selectedRatingFilter}-star reviews yet.`}
                                                    </Text>
                                                </Card>
                                            );
                                        })()}
                                    </Stack>

                                    {/* Pagination */}
                                    {ratingData?.totalPages > 1 && (
                                        <Box mt={30} style={{ display: 'flex', justifyContent: 'center' }}>
                                            <Pagination
                                                total={ratingData.totalPages}
                                                value={currentPage + 1}
                                                onChange={(p) => setCurrentPage(p - 1)}
                                                color="blue"
                                                size="lg"
                                            />
                                        </Box>
                                    )}
                                </Box>
                            </Tabs.Panel>
                        </Tabs>
                    </Grid.Col>

                    {/* Right: Booking card */}
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Card shadow="lg" padding="xl" radius="md" withBorder style={{ position: 'sticky', top: '20px' }}>
                            {/* Price */}
                            <Group justify="space-between" mb={16}>
                                <Box>
                                    <Text fw={700} color="blue.6" style={{ fontSize: '26px' }}>
                                        {formatPrice(roomData.basePrice)}
                                    </Text>
                                    <Text c="dimmed" size="sm">/ night</Text>
                                </Box>
                                {/* <Badge size="md" style={{ backgroundColor: '#e7f5ff', color: '#1971c2' }}>
                                    ✓ Recommended
                                </Badge> */}
                            </Group>

                            {/* <Stack gap="sm" mb={20}>
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Standard Capacity</Text>
                                    <Text size="sm" fw={600}>{roomData.standardCapacity} guests</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Max Capacity</Text>
                                    <Text size="sm" fw={600}>{roomData.maxCapacity} guests</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Extra person fee</Text>
                                    <Text size="sm" fw={600}>{formatPrice(roomData.extraPersonFee)}</Text>
                                </Group>
                            </Stack> */}
                            

                            <Button
                                fullWidth
                                size="lg"
                                color="blue"
                                onClick={() => navigate('/user/booking')}
                                style={{
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    padding: '12px',
                                }}
                            >
                                Book Now →
                            </Button>
                        </Card>
                    </Grid.Col>
                </Grid>

                {/* ── Other Room Classes ── */}
                <Box mt={60}>
                    <Title order={2} mb={30} style={{ fontSize: '28px', fontWeight: 700 }}>
                        Other room types you might like
                    </Title>

                    {otherLoading ? (
                        <Center py={40}>
                            <Loader size="lg" color="blue" />
                        </Center>
                    ) : otherRooms.length > 0 ? (
                        <Grid>
                            {otherRooms.map((other) => (
                                <Grid.Col key={other.id} span={{ base: 12, sm: 6, md: 4 }}>
                                    <Card
                                        shadow="sm"
                                        padding="0"
                                        radius="md"
                                        withBorder
                                        style={{
                                            cursor: 'pointer',
                                            transition: 'transform 0.3s ease',
                                            overflow: 'hidden'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                        onClick={() => navigate(`/user/rooms/${other.id}`)}
                                    >
                                        <Card.Section>
                                            <Image
                                                src={other.primaryImage?.dataUrl || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400'}
                                                height={200}
                                                alt={other.name}
                                                style={{ objectFit: 'cover' }}
                                                fallbackSrc="https://placehold.co/400x200?text=No+Image"
                                            />
                                        </Card.Section>
                                        <Box p="lg">
                                            <Title order={4} mb="xs" style={{ fontSize: '18px', fontWeight: 600 }}>
                                                {other.name}
                                            </Title>
                                            <Group gap="xs" mb="sm">
                                                <IconUsers size={14} color="#1971c2" />
                                                <Text c="dimmed" size="sm">{other.standardCapacity} guests</Text>
                                                <Badge size="xs" color="blue" variant="light">{other.totalRooms} rooms</Badge>
                                            </Group>
                                            <Group justify="space-between" align="flex-end">
                                                <Box>
                                                    <Text fw={700} color="blue.6" style={{ fontSize: '18px' }}>
                                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(other.basePrice || 0)}
                                                    </Text>
                                                    <Text c="dimmed" size="xs">/ night</Text>
                                                </Box>
                                                <Button
                                                    size="xs"
                                                    color="blue"
                                                    rightSection={<IconChevronRight size={14} />}
                                                >
                                                    View
                                                </Button>
                                            </Group>
                                        </Box>
                                    </Card>
                                </Grid.Col>
                            ))}
                        </Grid>
                    ) : (
                        <Card padding="lg" radius="md" withBorder>
                            <Text c="dimmed" ta="center" style={{ fontSize: '15px' }}>
                                No other room types to suggest.
                            </Text>
                        </Card>
                    )}
                </Box>
            </Container>
        </Box>
    );
}


