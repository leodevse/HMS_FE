import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Center, Stack, Loader, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import axiosInstance from '../../apis/axiosConfig';

export default function PaymentCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const hasFetched = useRef(false);

    useEffect(() => {
        // Tránh gọi API 2 lần do React Strict Mode
        if (hasFetched.current) return;
        hasFetched.current = true;

        const verifyPayment = async () => {
            try {
                const params = Object.fromEntries(searchParams.entries());
                // Sử dụng axiosInstance để tận dụng cấu hình baseURL và xử lý IPv4
                const response = await axiosInstance.get('/v1/payment/vnpay-ipn', { params });
                
                const data = response.data;
                if ((data.RspCode === '00' || data.RspCode === '02') && (data.vnp_ResponseCode === '00' || params.vnp_ResponseCode === '00')) {
                    // Thanh toán thực sự thành công
                    notifications.show({
                        title: 'Thanh toán thành công',
                        message: 'Cảm ơn bạn đã đặt phòng! Đơn hàng của bạn đã được xác nhận.',
                        color: 'green',
                        icon: <IconCheck size={16} />,
                        autoClose: 5000
                    });
                    navigate('/user');
                } else {
                    // Thất bại (hoặc vnp_ResponseCode != 00)
                    const errorMsg = data.vnp_ResponseCode ? `Mã lỗi: ${data.vnp_ResponseCode}` : `Lỗi hệ thống: ${data.RspCode}`;
                    notifications.show({
                        title: 'Thanh toán không thành công',
                        message: `Giao dịch thất bại hoặc đã bị hủy. (${errorMsg})`,
                        color: 'red',
                        icon: <IconX size={16} />,
                        autoClose: 10000
                    });
                    // Quay lại trang booking để người dùng có thể đặt lại
                    navigate('/user/booking');
                }
            } catch (error) {
                console.error('Error verifying payment:', error);
                notifications.show({
                    title: 'Lỗi',
                    message: 'Có lỗi xảy ra trong quá trình xác thực thanh toán.',
                    color: 'red',
                    icon: <IconX size={16} />
                });
                navigate('/user');
            }
        };

        verifyPayment();
    }, [searchParams, navigate]);

    return (
        <Center style={{ height: '70vh' }}>
            <Stack align="center">
                <Loader size="xl" />
                <Text size="lg">Đang xác thực giao dịch và chuyển hướng...</Text>
            </Stack>
        </Center>
    );
}
