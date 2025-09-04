// src/pages/DashboardPage.tsx
import { Card, Title, Text, Grid, Paper, Stack } from "@mantine/core";
import "./DashboardPage.css";

export function DashboardPage() {
  return (
    <div className="dashboard-container">
      <Title order={1} className="dashboard-title">
        User Dashboard
      </Title>

      <Grid gutter="lg" className="dashboard-grid">
        {/* Emotional State Placeholder */}
        <Grid.Col span={6}>
          <Card shadow="sm" radius="md" withBorder className="dashboard-card">
            <Title order={3}>Emotional State (Past Week)</Title>
            <div className="chart-placeholder bar-chart">
              <div className="bar" style={{ height: "40%" }}></div>
              <div className="bar" style={{ height: "70%" }}></div>
              <div className="bar" style={{ height: "55%" }}></div>
              <div className="bar" style={{ height: "85%" }}></div>
              <div className="bar" style={{ height: "30%" }}></div>
            </div>
            <div className="bar-labels">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
            </div>
          </Card>
        </Grid.Col>

        {/* Pie Chart Placeholder */}
        <Grid.Col span={6}>
          <Card shadow="sm" radius="md" withBorder className="dashboard-card">
            <Title order={3}>Conversation Metrics</Title>
            <div className="chart-placeholder pie-chart">
              <div className="pie"></div>
            </div>
            <div className="pie-labels">
              <span className="label-positive">Positive</span>
              <span className="label-neutral">Neutral</span>
              <span className="label-negative">Negative</span>
            </div>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Recent Activity Section */}
      <Paper shadow="xs" p="md" radius="md" withBorder className="activity-section">
        <Title order={3}>Recent Activity</Title>
        <Stack gap="sm" mt="md">
          <Text>- Had a positive conversation with chatbot yesterday</Text>
          <Text>- Expressed stress during last session</Text>
          <Text>- 5 conversations this week</Text>
        </Stack>
      </Paper>
    </div>
  );
}
