import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Grid, Card, Box, Text, Title, Button, Group, Stack,
    Badge, Tabs, Loader, Center, Image, Pagination
} from '@mantine/core';
import { IconPlus, IconMinus, IconTrash } from '@tabler/icons-react';
import { getServices, getServiceCategories } from '../../apis/customer/serviceApi';



export default function ServicesPage() {
    const navigate = useNavigate();
    const [cart, setCart] = useState([]);

    const [activeCategory, setActiveCategory] = useState('all');
    const [categories, setCategories] = useState([{ id: 'all', label: 'All', icon: '🌟' }]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [error, setError] = useState(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(null);

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getServiceCategories();
                // Map API response to our category format
                // data might be a simple array of strings (enums)
                const apiCategories = data.map(cat => ({
                    id: cat,
                    label: cat.charAt(0) + cat.slice(1).toLowerCase().replace('_', ' '),
                    icon: '✨'
                }));
                setCategories([{ id: 'all', label: 'All', icon: '🌟' }, ...apiCategories]);
            } catch (err) {
                console.error('Error fetching categories:', err);
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    // Reset to page 1 when category changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeCategory]);

    // Fetch services khi category hoặc trang thay đổi
    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getServices(activeCategory, currentPage - 1, pageSize);

                // Trích xuất dữ liệu mảng. Tùy theo API, thường nó là `data.content` hoặc `data.data`.
                const content = data?.data || data?.content || [];
                setServices(content);
                setTotalPages(data?.totalPages || 1);

                // Đồng bộ pageSize từ backend nếu có trả về
                if (data?.pageSize) {
                    const backendSize = Number(data.pageSize);
                    if (backendSize !== pageSize) {
                        setPageSize(backendSize);
                    }
                }
            } catch (err) {
                console.error('Error fetching services:', err);
                setError(err.response?.data?.message || 'Unable to load services. Please try again.');
                setServices([]);
                setTotalPages(1);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, [activeCategory, currentPage]);

    // ── Cart helpers ──
    const addToCart = (service) => {
        const existing = cart.find((item) => item.id === service.id);
        if (existing) {
            setCart(cart.map((item) =>
                item.id === service.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...service, quantity: 1 }]);
        }
    };

    const updateQuantity = (id, quantity) => {
        if (quantity <= 0) {
            removeFromCart(id);
        } else {
            setCart(cart.map((item) => item.id === id ? { ...item, quantity } : item));
        }
    };

    const removeFromCart = (id) => setCart(cart.filter((item) => item.id !== id));

    const getTotalPrice = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    const formatPrice = (price) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(price || 0);

    const getCategoryLabel = (category) => {
        if (!category) return '';
        return category.charAt(0) + category.slice(1).toLowerCase().replace('_', ' ');
    };

    // ── ServiceCard component ──
    const ServiceCard = ({ service }) => {
        return (
            <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                }}
            >
                <Card.Section>
                    <Image
                        src="https://images.unsplash.com/photo-1522336572468-97b06e8ef143?w=800&q=80"
                        height={160}
                        alt={service.name}
                        fallbackSrc="https://placehold.co/400x250?text=Service"
                    />
                </Card.Section>

                <Group justify="space-between" mt="md" mb="sm">
                    <Badge color="blue" variant="light" size="sm">
                        {getCategoryLabel(service.serviceCategory)}
                    </Badge>
                </Group>

                <Stack gap="xs" style={{ flex: 1 }}>
                    <Title order={4} style={{ fontSize: '16px', fontWeight: 600 }}>
                        {service.name}
                    </Title>
                    {service.description && (
                        <Text c="dimmed" style={{ fontSize: '14px', flex: 1 }}>
                            {service.description}
                        </Text>
                    )}

                    <Group justify="space-between" mt="auto" align="center">
                        <Text fw={700} color="blue.6" style={{ fontSize: '16px' }}>
                            {service.price}đ
                        </Text>
                        <Button
                            leftSection={<IconPlus size={16} />}
                            color="blue"
                            style={{ fontSize: '14px' }}
                            onClick={() => addToCart(service)}
                        >
                            Add
                        </Button>
                    </Group>
                </Stack>
            </Card >
        );
    };

    return (
        <Box>
            {/* Header */}
            <Box style={{ backgroundColor: 'var(--mantine-color-blue-9)', color: 'white', padding: '60px 0' }}>
                <Container size="xl">
                    <Title order={1} mb="md" style={{ fontSize: '28px', fontWeight: 700 }}>
                        Room Services
                    </Title>
                    <Text style={{ fontSize: '16px', opacity: 0.9 }}>
                        Order spa, minibar, and other amenities right to your room
                    </Text>
                </Container>
            </Box>

            <Box style={{ maxWidth: '1600px', margin: '0 auto', padding: '60px 40px' }}>
                <Grid>
                    {/* Main Content */}
                    <Grid.Col span={{ base: 12, md: 8 }}>
                        <Tabs
                            value={activeCategory}
                            onChange={setActiveCategory}
                            color="blue"
                        >
                            <Tabs.List mb={30}>
                                {categories.map((cat) => (
                                    <Tabs.Tab
                                        key={cat.id}
                                        value={cat.id}
                                        leftSection={<Text style={{ fontSize: '16px' }}>{cat.icon}</Text>}
                                        style={{ fontSize: '15px', fontWeight: 500 }}
                                    >
                                        {cat.label}
                                    </Tabs.Tab>
                                ))}
                            </Tabs.List>

                            {/* Panel content — dùng chung cho tất cả tab */}
                            {categories.map((cat) => (
                                <Tabs.Panel key={cat.id} value={cat.id}>
                                    {loading ? (
                                        <Center py={80}>
                                            <Loader size="lg" color="blue" />
                                        </Center>
                                    ) : error ? (
                                        <Box ta="center" py={60}>
                                            <Text c="red" size="lg" mb="md">{error}</Text>
                                            <Button
                                                variant="outline"
                                                color="blue"
                                                onClick={() => setActiveCategory(activeCategory)}
                                            >
                                                Try Again
                                            </Button>
                                        </Box>
                                    ) : services.length === 0 ? (
                                        <Box ta="center" py={60}>
                                            <Text c="dimmed" size="lg">No services available in this category.</Text>
                                        </Box>
                                    ) : (
                                        <Box>
                                            <Grid>
                                                {services.map((service) => (
                                                    <Grid.Col key={service.id} span={{ base: 12, sm: 6, md: 4 }}>
                                                        <ServiceCard service={service} />
                                                    </Grid.Col>
                                                ))}
                                            </Grid>

                                            {totalPages > 1 && (
                                                <Group justify="center" mt={40}>
                                                    <Pagination
                                                        total={totalPages}
                                                        value={currentPage}
                                                        onChange={setCurrentPage}
                                                        color="blue"
                                                        size="lg"
                                                    />
                                                </Group>
                                            )}
                                        </Box>
                                    )}
                                </Tabs.Panel>
                            ))}
                        </Tabs>
                    </Grid.Col>

                    {/* Cart Sidebar */}
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Card shadow="lg" padding="xl" radius="md" withBorder style={{ position: 'sticky', top: '20px' }}>
                            <Group justify="space-between" mb="md">
                                <Title order={3} style={{ fontSize: '18px', fontWeight: 600 }}>
                                    Cart
                                </Title>
                                <Badge
                                    size="xl"
                                    circle
                                    color="blue"
                                    style={{ color: 'white', fontSize: '16px' }}
                                >
                                    {cart.reduce((total, item) => total + item.quantity, 0)}
                                </Badge>
                            </Group>

                            {cart.length === 0 ? (
                                <Box ta="center" py={50}>
                                    <Text c="dimmed" style={{ fontSize: '16px' }}>Cart is empty</Text>
                                    <Text c="dimmed" size="sm" mt="xs">Add services to order</Text>
                                </Box>
                            ) : (
                                <>
                                    <Stack gap="md" mb="md" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                                        {cart.map((item) => (
                                            <Card key={item.id} padding="md" radius="md" withBorder>
                                                <Group justify="space-between" mb="sm">
                                                    <Text fw={600} style={{ fontSize: '15px', flex: 1 }}>
                                                        {item.name}
                                                    </Text>
                                                    <Button
                                                        size="xs"
                                                        variant="subtle"
                                                        color="red"
                                                        onClick={() => removeFromCart(item.id)}
                                                        p={4}
                                                    >
                                                        <IconTrash size={16} />
                                                    </Button>
                                                </Group>
                                                <Group justify="space-between">
                                                    <Group gap={6}>
                                                        <Button
                                                            size="sm"
                                                            variant="light"
                                                            color="blue"
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            p={6}
                                                        >
                                                            <IconMinus size={14} />
                                                        </Button>
                                                        <Text fw={600} style={{ fontSize: '16px', minWidth: '32px', textAlign: 'center' }}>
                                                            {item.quantity}
                                                        </Text>
                                                        <Button
                                                            size="sm"
                                                            variant="light"
                                                            color="blue"
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            p={6}
                                                        >
                                                            <IconPlus size={14} />
                                                        </Button>
                                                    </Group>
                                                    <Text fw={700} color="blue.6" style={{ fontSize: '16px' }}>
                                                        {formatPrice(item.price * item.quantity)}
                                                    </Text>
                                                </Group>
                                            </Card>
                                        ))}
                                    </Stack>

                                    <Box pt="lg" style={{ borderTop: '2px solid #e9ecef' }}>
                                        <Group justify="space-between" mb="lg">
                                            <Text fw={700} style={{ fontSize: '16px' }}>Total</Text>
                                            <Text fw={700} color="blue.6" style={{ fontSize: '18px' }}>
                                                {formatPrice(getTotalPrice())}
                                            </Text>
                                        </Group>
                                        <Button
                                            fullWidth
                                            size="lg"
                                            color="blue"
                                            style={{
                                                fontSize: '15px',
                                                fontWeight: 600,
                                                padding: '14px'
                                            }}
                                            onClick={() => navigate('/user/services/checkout', { state: { cart } })}
                                        >
                                            Place Order
                                        </Button>
                                    </Box>
                                </>
                            )}
                        </Card>
                    </Grid.Col>
                </Grid>
            </Box>
        </Box>
    );
}
