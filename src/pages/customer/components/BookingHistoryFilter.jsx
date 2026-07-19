// src/pages/customer/components/BookingHistoryFilter.jsx
import { Paper, Stack, Group, Text, Radio, RangeSlider, Button } from '@mantine/core';
import { IconFilter, IconX } from '@tabler/icons-react';

export function BookingHistoryFilter({
                                         filters,
                                         onFilterChange,
                                         onClearFilters,
                                         priceRange
                                     }) {
    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'pending', label: 'Pending' }
    ];

    const sortOptions = [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'price_high', label: 'Price: High to Low' },
        { value: 'price_low', label: 'Price: Low to High' }
    ];

    return (
        <Paper withBorder p="md" radius="md">
            <Stack>
                <Group justify="space-between">
                    <Group gap="xs">
                        <IconFilter size={18} />
                        <Text fw={500}>Filters</Text>
                    </Group>
                    <Button
                        variant="subtle"
                        size="compact-sm"
                        leftSection={<IconX size={14} />}
                        onClick={onClearFilters}
                    >
                        Clear all
                    </Button>
                </Group>

                <div>
                    <Text size="sm" fw={500} mb="xs">Status</Text>
                    <Radio.Group
                        value={filters.status}
                        onChange={(value) => onFilterChange('status', value)}
                    >
                        <Stack gap="xs">
                            {statusOptions.map(option => (
                                <Radio
                                    key={option.value}
                                    value={option.value}
                                    label={option.label}
                                    size="sm"
                                />
                            ))}
                        </Stack>
                    </Radio.Group>
                </div>

                <div>
                    <Text size="sm" fw={500} mb="xs">Sort by</Text>
                    <Radio.Group
                        value={filters.sortBy}
                        onChange={(value) => onFilterChange('sortBy', value)}
                    >
                        <Stack gap="xs">
                            {sortOptions.map(option => (
                                <Radio
                                    key={option.value}
                                    value={option.value}
                                    label={option.label}
                                    size="sm"
                                />
                            ))}
                        </Stack>
                    </Radio.Group>
                </div>

                <div>
                    <Text size="sm" fw={500} mb="xs">Price Range</Text>
                    <RangeSlider
                        min={priceRange.min}
                        max={priceRange.max}
                        step={500000}
                        value={filters.priceRange || [priceRange.min, priceRange.max]}
                        onChange={(value) => onFilterChange('priceRange', value)}
                        label={(value) =>
                            new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                                notation: 'compact'
                            }).format(value)
                        }
                    />
                    <Group justify="space-between" mt="xs">
                        <Text size="xs" c="dimmed">
                            {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND'
                            }).format(filters.priceRange?.[0] || priceRange.min)}
                        </Text>
                        <Text size="xs" c="dimmed">
                            {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND'
                            }).format(filters.priceRange?.[1] || priceRange.max)}
                        </Text>
                    </Group>
                </div>
            </Stack>
        </Paper>
    );
}