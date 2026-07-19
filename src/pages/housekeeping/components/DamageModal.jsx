// src/pages/housekeeping/components/DamageModal.jsx
import { useState } from 'react';
import {
    Modal,
    Stack,
    TextInput,
    Textarea,
    NumberInput,
    Button,
    Group,
    Select,
    Paper,
    Text,
    Divider,
    Radio
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { housekeepingApi } from '../../../apis/housekeepingApi';

export function DamageModal({ opened, onClose, roomId, reservationId, onSuccess }) {
    const [formData, setFormData] = useState({
        description: '',
        quantity: 1,
        penaltyAmount: 0,
        itemType: 'existing',
        selectedItem: '',
        customItem: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const commonDamages = [
        { value: 'tv', label: 'TV / Remote - $150' },
        { value: 'mirror', label: 'Mirror - $80' },
        { value: 'bedsheet', label: 'Bed Sheet - $30' },
        { value: 'towel', label: 'Towel - $15' },
        { value: 'lamp', label: 'Lamp - $25' },
        { value: 'curtain', label: 'Curtain - $45' },
        { value: 'glass', label: 'Glass / Cup - $5' },
        { value: 'furniture', label: 'Furniture - Custom' }
    ];

    const handleItemSelect = (value) => {
        setFormData(prev => ({ ...prev, selectedItem: value }));

        // Auto-fill description and penalty based on selection
        switch(value) {
            case 'tv':
                setFormData(prev => ({ ...prev, description: 'Damaged TV / Remote', penaltyAmount: 150 }));
                break;
            case 'mirror':
                setFormData(prev => ({ ...prev, description: 'Broken mirror', penaltyAmount: 80 }));
                break;
            case 'bedsheet':
                setFormData(prev => ({ ...prev, description: 'Torn bed sheet', penaltyAmount: 30 }));
                break;
            case 'towel':
                setFormData(prev => ({ ...prev, description: 'Damaged towel', penaltyAmount: 15 }));
                break;
            case 'lamp':
                setFormData(prev => ({ ...prev, description: 'Broken lamp', penaltyAmount: 25 }));
                break;
            case 'curtain':
                setFormData(prev => ({ ...prev, description: 'Torn curtain', penaltyAmount: 45 }));
                break;
            case 'glass':
                setFormData(prev => ({ ...prev, description: 'Broken glass/cup', penaltyAmount: 5 }));
                break;
            default:
                break;
        }
    };

    const handleSubmit = async () => {
        // Validate
        if (formData.itemType === 'existing' && !formData.selectedItem) {
            notifications.show({
                title: 'Error',
                message: 'Please select damaged item',
                color: 'red'
            });
            return;
        }

        if (formData.itemType === 'custom' && !formData.customItem) {
            notifications.show({
                title: 'Error',
                message: 'Please describe the damaged item',
                color: 'red'
            });
            return;
        }

        if (!formData.description) {
            notifications.show({
                title: 'Error',
                message: 'Please provide description',
                color: 'red'
            });
            return;
        }

        if (formData.penaltyAmount <= 0) {
            notifications.show({
                title: 'Error',
                message: 'Please enter penalty amount',
                color: 'red'
            });
            return;
        }

        setSubmitting(true);
        try {
            // API call would go here
            // await housekeepingApi.reportDamage({
            //     roomId,
            //     reservationId,
            //     description: formData.description,
            //     quantity: formData.quantity,
            //     penaltyAmount: formData.penaltyAmount
            // });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            notifications.show({
                title: 'Success',
                message: `Damage reported - Penalty: $${formData.penaltyAmount.toFixed(2)}`,
                color: 'green'
            });

            if (onSuccess) onSuccess();
            onClose();

            // Reset form
            setFormData({
                description: '',
                quantity: 1,
                penaltyAmount: 0,
                itemType: 'existing',
                selectedItem: '',
                customItem: ''
            });
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to report damage',
                color: 'red'
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Report Damage"
            size="md"
            centered
        >
            <Stack>
                <Text size="sm" c="dimmed">
                    Report damaged items in the room. Penalty will be added to guest's folio.
                </Text>

                <Divider />

                <Radio.Group
                    value={formData.itemType}
                    onChange={(value) => setFormData(prev => ({ ...prev, itemType: value }))}
                >
                    <Group>
                        <Radio value="existing" label="Select from common items" />
                        <Radio value="custom" label="Describe custom item" />
                    </Group>
                </Radio.Group>

                {formData.itemType === 'existing' && (
                    <Select
                        label="Damaged Item"
                        placeholder="Select item"
                        data={commonDamages}
                        value={formData.selectedItem}
                        onChange={handleItemSelect}
                        searchable
                    />
                )}

                {formData.itemType === 'custom' && (
                    <TextInput
                        label="Item Name"
                        placeholder="e.g., Coffee machine, Hair dryer..."
                        value={formData.customItem}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            customItem: e.target.value,
                            description: e.target.value
                        }))}
                    />
                )}

                <Textarea
                    label="Description"
                    placeholder="Describe the damage in detail..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                    minRows={3}
                />

                <NumberInput
                    label="Quantity"
                    value={formData.quantity}
                    onChange={(val) => setFormData(prev => ({ ...prev, quantity: val }))}
                    min={1}
                />

                <NumberInput
                    label="Penalty Amount ($)"
                    value={formData.penaltyAmount}
                    onChange={(val) => setFormData(prev => ({ ...prev, penaltyAmount: val }))}
                    min={0}
                    step={5}
                    precision={2}
                />

                {formData.penaltyAmount > 0 && (
                    <Paper withBorder p="md" bg="red.0">
                        <Group justify="space-between">
                            <Text fw={600}>Penalty amount:</Text>
                            <Text fw={700} size="xl" c="red">
                                ${formData.penaltyAmount.toFixed(2)}
                            </Text>
                        </Group>
                    </Paper>
                )}

                <Group grow mt="md">
                    <Button variant="light" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        loading={submitting}
                        color="red"
                    >
                        Report Damage
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}