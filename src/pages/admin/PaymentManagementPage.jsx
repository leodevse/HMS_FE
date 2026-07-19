import { Title, Paper, Tabs } from '@mantine/core';
import { IconReceipt2, IconCashBanknote } from '@tabler/icons-react';
import { TransactionTab } from '../../components/admin/payment/TransactionTab';
import { RefundTab } from '../../components/admin/payment/RefundTab';

export default function PaymentManagementPage() {
    return (
        <div>
            <Title order={2} mb="lg">Quản lý Thanh toán & Hoàn tiền</Title>

            <Paper shadow="sm" p="md" radius="md" withBorder>
                <Tabs defaultValue="transactions" color="blue">
                    <Tabs.List mb="md">
                        <Tabs.Tab
                            value="transactions"
                            leftSection={<IconReceipt2 size={16} />}
                        >
                            Quản lý giao dịch
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="refunds"
                            leftSection={<IconCashBanknote size={16} />}
                        >
                            Quản lý hoàn tiền
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="transactions">
                        <TransactionTab />
                    </Tabs.Panel>

                    <Tabs.Panel value="refunds">
                        <RefundTab />
                    </Tabs.Panel>
                </Tabs>
            </Paper>
        </div>
    );
}