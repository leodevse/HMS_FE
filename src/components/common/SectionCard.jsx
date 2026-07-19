import { Paper, Text } from "@mantine/core";

export const SectionCard = ({ title, children }) => (
    <Paper radius="lg" shadow="sm" withBorder p="xl" style={{ backgroundColor: "#fff" }}>
        <Text fw={700} size="md" mb="lg" c="blue.7" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {title}
        </Text>
        {children}
    </Paper>
);
