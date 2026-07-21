import axiosInstance from '../axiosConfig';

const asArray = (payload) => Array.isArray(payload) ? payload : (payload?.content || []);

const FALLBACK_ROOMS = [
    { id: 'standard', isFallback: true, className: 'Standard', name: 'Standard', basePrice: 800000, standardOccupancy: 2, standardCapacity: 2, averageRating: 4.9, primaryImage: { dataUrl: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=85' } },
    { id: 'deluxe', isFallback: true, className: 'Deluxe', name: 'Deluxe', basePrice: 1200000, standardOccupancy: 2, standardCapacity: 2, averageRating: 4.7, primaryImage: { dataUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=85' } },
    { id: 'suite', isFallback: true, className: 'Suite', name: 'Suite', basePrice: 2500000, standardOccupancy: 2, standardCapacity: 2, averageRating: 4.8, primaryImage: { dataUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=85' } },
];

const FALLBACK_SERVICES = [
    { id: 'breakfast', name: 'Breakfast Buffet', serviceCategory: 'F_AND_B', description: 'Start your morning with a generous selection of fresh local and international dishes.' },
    { id: 'minibar', name: 'Minibar - Soft Drink', serviceCategory: 'MINIBAR', description: 'Refreshments are prepared in your room for a more comfortable stay.' },
    { id: 'massage', name: 'Aroma Massage 60min', serviceCategory: 'SPA', description: 'Relax and restore your energy with our signature aroma massage.' },
];

const FALLBACK_TESTIMONIALS = [
    { id: 'guest-1', name: 'Nam', rating: 5, comment: 'Dịch vụ tuyệt vời, phòng sạch sẽ thoáng mát!', date: 'Verified Guest' },
    { id: 'guest-2', name: 'Anna Tran', rating: 5, comment: 'Không gian sang trọng, nhân viên thân thiện và rất chu đáo.', date: 'Verified Guest' },
];

export const getHomeData = async () => {
    const [roomResult, serviceResult, reviewResult] = await Promise.allSettled([
        axiosInstance.get('/catalog/room-classes', { params: { size: 6 } }),
        axiosInstance.get('/catalog/services', { params: { size: 6 } }),
        axiosInstance.get('/reviews', { params: { page: 0, size: 6 } }),
    ]);

    const roomClasses = roomResult.status === 'fulfilled' ? asArray(roomResult.value.data) : [];
    const serviceItems = serviceResult.status === 'fulfilled' ? asArray(serviceResult.value.data) : [];
    const reviewItems = reviewResult.status === 'fulfilled' ? asArray(reviewResult.value.data) : [];

    return {
        featuredRooms: (roomClasses.length ? roomClasses : FALLBACK_ROOMS).map((room) => ({
            ...room,
            name: room.name || room.className,
            standardCapacity: room.standardCapacity || room.standardOccupancy,
        })),
        services: serviceItems.length ? serviceItems.map((service) => ({
            ...service,
            name: service.serviceName,
            serviceCategory: service.category,
            price: Number(service.unitPrice || 0),
        })) : FALLBACK_SERVICES,
        testimonials: reviewItems.length ? reviewItems.map((review) => ({
            ...review,
            name: `Guest #${review.customerId}`,
            date: review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : 'Verified Guest',
        })) : FALLBACK_TESTIMONIALS,
    };
};
