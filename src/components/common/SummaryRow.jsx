import {Group, Text} from "@mantine/core";

/**
 * Component để hiển thị một dòng tóm tắt với nhãn và giá trị, có thể tùy chỉnh kiểu chữ và màu sắc.
 *
 * @param label
 * @param value
 * @param bold
 * @param color
 * @param size
 * @returns {React.JSX.Element}
 * @constructor
 */
export const SummaryRow = ({label, value, bold, color, size = "sm"}) => {
    let labelColor = color;
    let textColor = color;
    if (!color) {
        labelColor = "gray.7";
        textColor = "gray.9";
    }

    return (
            <Group justify="space-between">
                <Text size={size} c={labelColor} fw={bold ? 700 : 400}>
                    {label}
                </Text>
                <Text size={size} c={textColor} fw={bold ? 800 : 600}>
                    {value}
                </Text>
            </Group>
    );
};

