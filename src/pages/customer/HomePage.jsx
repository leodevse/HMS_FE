import {useEffect, useState} from 'react';
import {
    Avatar,
    Badge,
    Box,
    Button,
    Card,
    Container,
    Divider,
    Grid,
    Group,
    Image,
    Overlay,
    Paper,
    Rating,
    Stack,
    Text,
    Title
} from '@mantine/core';
import {Carousel} from '@mantine/carousel';
import {
    IconArrowRight,
    IconChevronRight,
    IconQuote,
    IconSparkles,
    IconSwimming,
    IconToolsKitchen2
} from '@tabler/icons-react';
import {useLocation, useNavigate} from 'react-router-dom';
import '@mantine/carousel/styles.css';
import {getHomeData} from '../../apis/customer/homeApi';

const HERO_IMAGES = [
    {
        url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600&q=80',
        title: 'Experience 5-star Luxury Vacations',
        desc: 'Luxurious space, perfect service, and memorable moments just for you.'
    },
    {
        url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600&q=80',
        title: 'Modern Suites & Elegant Design',
        desc: 'Escape to a haven of tranquility with our meticulously crafted suites.'
    }
];

export default function HomePage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [featuredRooms, setFeaturedRooms] = useState([]);
    const [services, setServices] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(false);

    // ✅ Các path được phép hiển thị HomePage
    const allowedPaths = ['/', '/user', '/user/'];

    useEffect(() => {
        // ✅ Kiểm tra path có được phép không
        if (!allowedPaths.includes(location.pathname)) {
            console.log('HomePage: Not at allowed path, skipping API call');
            return;
        }

        const fetchAllHomeData = async () => {
            console.log('HomePage: Fetching home data...');
            setLoading(true);
            try {
                const data = await getHomeData();
                setFeaturedRooms(data.featuredRooms || []);
                setServices(data.services || []);
                setTestimonials(data.testimonials || []);
            } catch (error) {
                console.error('Error isLoading home data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllHomeData();

        return () => {
            console.log('HomePage: Unmounting or path changed');
        };
    }, [location.pathname]);

    // ✅ Kiểm tra trước khi render
    if (!allowedPaths.includes(location.pathname)) {
        return null;
    }

    const formatPrice = (price) =>
            new Intl.NumberFormat('en-US', {style: 'currency', currency: 'VND'}).format(price || 0);

    const getServiceIcon = (category) => {
        if (category === 'SPA') return <IconSparkles size={32}/>;
        if (category === 'MINIBAR') return <IconToolsKitchen2 size={32}/>;
        return <IconSwimming size={32}/>;
    };


    return (
            <Box>
                {/* ── Hero Carousel Section ── */}
                <Box style={{position: 'relative'}}>
                    <Carousel
                            withIndicators
                            loop
                            withControls={false}
                            height="85vh"
                            styles={{
                                indicator: {
                                    width: '12px',
                                    height: '12px',
                                    transition: 'width 250ms ease',
                                },
                                indicators: {
                                    '& [data-active]': {
                                        width: '40px',
                                    },
                                },
                            }}
                    >
                        {HERO_IMAGES.map((hero, index) => (
                                <Carousel.Slide key={index}>
                                    <Box
                                            style={{
                                                height: '100%',
                                                backgroundImage: `url(${hero.url})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative'
                                            }}
                                    >
                                        <Overlay color="#000" opacity={0.45} zIndex={1}/>
                                        <Container size="lg" style={{
                                            position: 'relative',
                                            zIndex: 2,
                                            textAlign: 'center',
                                            color: 'white'
                                        }}>
                                            <Stack align="center" gap="xl">
                                                <Badge
                                                        size="lg"
                                                        variant="filled"
                                                        color="blue.6"
                                                        style={{padding: '8px 20px', letterSpacing: '1px'}}
                                                >
                                                    PREMIUM HOSPITALITY
                                                </Badge>
                                                <Title
                                                        order={1}
                                                        fw={900}
                                                        style={{
                                                            fontSize: 'clamp(32px, 5vw, 64px)',
                                                            lineHeight: 1.1,
                                                            textShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                                        }}
                                                >
                                                    {hero.title}
                                                </Title>
                                                <Text
                                                        size="xl"
                                                        maw={700}
                                                        style={{
                                                            fontSize: 'clamp(16px, 2vw, 20px)',
                                                            opacity: 0.95,
                                                            fontWeight: 400
                                                        }}
                                                >
                                                    {hero.desc}
                                                </Text>

                                                <Group gap="md" mt="lg">
                                                    <Button
                                                            size="xl"
                                                            color="blue"
                                                            radius="md"
                                                            onClick={() => navigate('/user/booking')}
                                                            rightSection={<IconArrowRight size={20}/>}
                                                            style={{
                                                                height: '56px',
                                                                padding: '0 40px',
                                                                boxShadow: '0 8px 24px rgba(34, 139, 230, 0.4)'
                                                            }}
                                                    >
                                                        Book Your Stay
                                                    </Button>
                                                    <Button
                                                            size="xl"
                                                            variant="white"
                                                            color="dark"
                                                            radius="md"
                                                            onClick={() => navigate('/user/rooms')}
                                                            style={{height: '56px', padding: '0 40px'}}
                                                    >
                                                        Explore Rooms
                                                    </Button>
                                                </Group>
                                            </Stack>
                                        </Container>
                                    </Box>
                                </Carousel.Slide>
                        ))}
                    </Carousel>
                </Box>

                {/* ── Featured Rooms Section ── */}
                <Box py={100} style={{backgroundColor: '#fff'}}>
                    <Container size="xl">
                        <Group justify="space-between" align="flex-end" mb={60}>
                            <Box>
                                <Badge color="blue" variant="light" size="lg" mb="sm">OUR COLLECTION</Badge>
                                <Title order={2} fw={800} style={{fontSize: '38px', color: '#1A1B1E'}}>
                                    Featured Room Classes
                                </Title>
                                <Text c="dimmed" maw={600} mt="xs">
                                    Discover our range of sophisticated accommodations, each designed to provide an
                                    unparalleled level of comfort.
                                </Text>
                            </Box>
                            <Button
                                    variant="subtle"
                                    color="blue"
                                    size="lg"
                                    rightSection={<IconChevronRight size={18}/>}
                                    onClick={() => navigate('/user/rooms')}
                            >
                                View All Rooms
                            </Button>
                        </Group>

                        <Grid gutter="xl">
                            {featuredRooms.slice(0, 3).map((room, idx) => (
                                    <Grid.Col key={room.id || idx} span={{base: 12, sm: 6, md: 4}}>
                                        <Card
                                                radius="xl"
                                                p="md"
                                                withBorder
                                                style={{
                                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    overflow: 'hidden',
                                                    height: '100%',
                                                    cursor: 'pointer'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-12px)';
                                                    e.currentTarget.style.boxShadow = '0 24px 48px -12px rgba(0,0,0,0.15)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                                onClick={() => navigate(`/user/rooms/${room.id}`)}
                                        >
                                            <Card.Section style={{position: 'relative'}}>
                                                <Image
                                                        src={room.primaryImage?.dataUrl || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=500'}
                                                        height={280}
                                                        alt={room.name}
                                                        style={{transition: 'transform 0.6s ease', objectFit: 'cover'}}
                                                        fallbackSrc="https://placehold.co/300x220?text=No+Image"
                                                />
                                                <Badge
                                                        pos="absolute"
                                                        top={20}
                                                        right={20}
                                                        color="blue"
                                                        size="lg"
                                                        style={{
                                                            backgroundColor: 'rgba(255,255,255,0.9)',
                                                            color: '#1c7ed6',
                                                            fontWeight: 700
                                                        }}
                                                >
                                                    {room.averageRating?.toFixed(1) || '5.0'} ★
                                                </Badge>
                                            </Card.Section>

                                            <Stack justify="space-between" mt="xl" style={{flex: 1}}>
                                                <Box>
                                                    <Title order={3} style={{fontSize: '22px', fontWeight: 700}}>
                                                        {room.name}
                                                    </Title>
                                                    <Text c="dimmed" size="sm" mt={5}>
                                                        Standard {room.standardCapacity} Guests • Luxury Amenities
                                                    </Text>
                                                </Box>

                                                <Group justify="space-between" align="flex-end" pt="lg">
                                                    <Box>
                                                        <Text size="xs" c="dimmed" fw={700}
                                                              style={{textTransform: 'uppercase'}}>Starting from</Text>
                                                        <Text fw={800} color="blue" style={{fontSize: '24px'}}>
                                                            {formatPrice(room.basePrice)}
                                                            <span style={{
                                                                fontSize: '14px',
                                                                fontWeight: 500,
                                                                color: '#868e96'
                                                            }}> / night</span>
                                                        </Text>
                                                    </Box>
                                                    <Avatar.Group spacing="sm">
                                                        <Avatar size="sm" radius="xl" color="blue" src={null}/>
                                                        <Avatar size="sm" radius="xl" color="blue" src={null}/>
                                                        <Text size="xs" fw={500} c="dimmed">+200 reviews</Text>
                                                    </Avatar.Group>
                                                </Group>
                                            </Stack>
                                        </Card>
                                    </Grid.Col>
                            ))}
                        </Grid>
                    </Container>
                </Box>

                {/* ── Modern Services Section ── */}
                <Box py={100} style={{backgroundColor: '#F8F9FA'}}>
                    <Container size="xl">
                        <Stack align="center" mb={60}>
                            <Badge size="lg" color="blue" variant="outline">GUEST SERVICES</Badge>
                            <Title ta="center" order={2} fw={800} style={{fontSize: '38px'}}>
                                Elevating Your Experience
                            </Title>
                            <Text ta="center" c="dimmed" maw={650}>
                                From gourmet dining to holistic wellness, we provide a comprehensive suite of services
                                designed around your needs.
                            </Text>
                        </Stack>

                        <Grid gutter={30}>
                            {services.slice(0, 4).map((service, index) => (
                                    <Grid.Col key={index} span={{base: 12, sm: 6, md: 3}}>
                                        <Card
                                                p="xl"
                                                radius="xl"
                                                withBorder
                                                style={{
                                                    textAlign: 'center',
                                                    height: '100%',
                                                    backgroundColor: '#fff',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#1c7ed6';
                                                    e.currentTarget.querySelector('h3').style.color = '#fff';
                                                    e.currentTarget.querySelector('p').style.color = 'rgba(255,255,255,0.8)';
                                                    e.currentTarget.querySelector('.service-icon').style.backgroundColor = 'rgba(255,255,255,0.2)';
                                                    e.currentTarget.querySelector('.service-icon svg').style.color = '#fff';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#fff';
                                                    e.currentTarget.querySelector('h3').style.color = '#1A1B1E';
                                                    e.currentTarget.querySelector('p').style.color = '#868e96';
                                                    e.currentTarget.querySelector('.service-icon').style.backgroundColor = 'var(--mantine-color-blue-0)';
                                                    e.currentTarget.querySelector('.service-icon svg').style.color = 'var(--mantine-color-blue-6)';
                                                }}
                                                onClick={() => navigate('/user/services')}
                                        >
                                            <Box
                                                    className="service-icon"
                                                    style={{
                                                        width: '80px',
                                                        height: '80px',
                                                        borderRadius: '24px',
                                                        backgroundColor: 'var(--mantine-color-blue-0)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        margin: '0 auto 24px',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                            >
                                                <Box style={{
                                                    color: 'var(--mantine-color-blue-6)',
                                                    transition: 'all 0.3s ease'
                                                }}>
                                                    {getServiceIcon(service.serviceCategory)}
                                                </Box>
                                            </Box>
                                            <Title order={3} fw={700} mb="sm"
                                                   style={{fontSize: '20px', transition: 'all 0.3s ease'}}>
                                                {service.name}
                                            </Title>
                                            <Text size="sm" c="dimmed" style={{transition: 'all 0.3s ease'}}>
                                                {service.description || "Indulge in our premium offerings designed to make your stay unforgettable."}
                                            </Text>
                                        </Card>
                                    </Grid.Col>
                            ))}
                        </Grid>
                    </Container>
                </Box>

                {/* ── Professional Testimonials ── */}
                <Box py={100} style={{backgroundColor: '#fff'}}>
                    <Container size="xl">
                        <Grid gutter={100} align="center">
                            <Grid.Col span={{base: 12, md: 5}}>
                                <Badge size="lg" color="blue" variant="filled" mb="md">GUEST REVIEWS</Badge>
                                <Title order={2} fw={850} style={{fontSize: '42px', lineHeight: 1.2}}>
                                    Voices of Our Valued Guests
                                </Title>
                                <Text c="dimmed" size="lg" mt="xl" mb="xl">
                                    We pride ourselves on delivering excellence. Read about the experiences of our
                                    international community.
                                </Text>
                                <Group gap="xl">
                                    <Box>
                                        <Text fw={800} style={{fontSize: '32px'}}>4.9/5</Text>
                                        <Rating value={4.9} fractions={2} readOnly/>
                                        <Text size="sm" c="dimmed" mt={4}>Average Rating</Text>
                                    </Box>
                                    <Divider orientation="vertical"/>
                                    <Box>
                                        <Text fw={800} style={{fontSize: '32px'}}>2k+</Text>
                                        <Text size="sm" c="dimmed" mt={4}>Happy Guests</Text>
                                    </Box>
                                </Group>
                            </Grid.Col>

                            <Grid.Col span={{base: 12, md: 7}}>
                                <Stack gap="xl">
                                    {testimonials.slice(0, 2).map((item, index) => (
                                            <Paper
                                                    key={index}
                                                    p={40}
                                                    radius="xl"
                                                    withBorder
                                                    style={{
                                                        position: 'relative',
                                                        boxShadow: index === 0 ? '0 20px 40px rgba(0,0,0,0.05)' : 'none',
                                                        backgroundColor: index === 0 ? '#fff' : '#F8F9FA'
                                                    }}
                                            >
                                                <IconQuote
                                                        size={48}
                                                        style={{
                                                            position: 'absolute',
                                                            top: 20,
                                                            right: 40,
                                                            opacity: 0.1,
                                                            color: 'var(--mantine-color-blue-6)'
                                                        }}
                                                />
                                                <Text size="lg" fw={500} style={{fontStyle: 'italic', lineHeight: 1.6}}>
                                                    "{item.comment}"
                                                </Text>
                                                <Group mt="xl">
                                                    <Avatar size="lg" radius="xl" color="blue">
                                                        {item.name?.charAt(0) || 'G'}
                                                    </Avatar>
                                                    <Box>
                                                        <Text fw={700}>{item.name || 'Guest'}</Text>
                                                        <Text size="xs" c="dimmed">Verified Guest
                                                            • {item.date || 'March 2024'}</Text>
                                                        <Rating size="xs" value={5} readOnly mt={4}/>
                                                    </Box>
                                                </Group>
                                            </Paper>
                                    ))}
                                </Stack>
                            </Grid.Col>
                        </Grid>
                    </Container>
                </Box>

                {/* ── Final Call to Action ── */}
                <Box py={80}>
                    <Container size="xl">
                        <Paper
                                p={60}
                                radius="30px"
                                style={{
                                    backgroundImage: 'linear-gradient(135deg, #1c7ed6 0%, #1864ab 100%)',
                                    color: '#fff',
                                    textAlign: 'center'
                                }}
                        >
                            <Stack align="center" gap="md">
                                <Title order={2} fw={800} style={{fontSize: '38px', letterSpacing: '-0.5px'}}>
                                    Ready to Experience the Extraordinary?
                                </Title>
                                <Text maw={600} opacity={0.8} size="lg">
                                    Join thousands of satisfied guests and book your dream vacation at HMS Hotel today.
                                </Text>
                                <Button
                                        size="xl"
                                        variant="white"
                                        color="blue"
                                        mt="xl"
                                        radius="md"
                                        onClick={() => navigate('/user/booking')}
                                        style={{height: '60px', padding: '0 50px', fontWeight: 700}}
                                >
                                    Reserve Your Room Now
                                </Button>
                            </Stack>
                        </Paper>
                    </Container>
                </Box>
            </Box>
    );
}