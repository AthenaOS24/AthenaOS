import { Container, Title, Text, Card, SimpleGrid, Button, Stack } from '@mantine/core';
import './ServicePage.css';

export function ServicesPage() {
  return (
    <div className="services-page">
      <Container size="lg" py={60}>
        <Title className="services-title" order={1}>
          Our Services
        </Title>
        

        <SimpleGrid 
          cols={{ base: 1, sm: 2, md: 3 }} 
          spacing="xl" 
          mt={50}
        >
          {/* Service Card 1 */}
          <Card className="service-card" shadow="xl" p="xl" radius="md">
            <div className="service-icon">🧠</div>
            <Title order={3} className="service-title">AI-Powered Therapy</Title>
            <Text className="service-desc">
              Personalized therapy sessions guided by our advanced AI, designed to help you explore your thoughts safely and effectively.
            </Text>
          </Card>

          {/* Service Card 2 */}
          <Card className="service-card" shadow="xl" p="xl" radius="md">
            <div className="service-icon">💬</div>
            <Title order={3} className="service-title">24/7 Chat Support</Title>
            <Text className="service-desc">
              Reach out anytime. Our chatbot is always available to provide emotional support and guidance when you need it the most.
            </Text>
          </Card>

          {/* Service Card 3 */}
          <Card className="service-card" shadow="xl" p="xl" radius="md">
            <div className="service-icon">📊</div>
            <Title order={3} className="service-title">Mood & Progress Tracking</Title>
            <Text className="service-desc">
              Keep track of your emotional well-being over time and receive insightful suggestions tailored to your mental health journey.
            </Text>
          </Card>
        </SimpleGrid>

        <Stack align="center" mt={80}>
          <Title order={2} className="services-cta-title">
            Ready to Start Your Journey?
          </Title>
          <Text className="services-cta-desc">
            Connect with our AI chatbot and begin improving your mental health today.
          </Text>
          <Button className="services-cta-button" size="lg">
            Get Started
          </Button>
        </Stack>
      </Container>
    </div>
  );
}

