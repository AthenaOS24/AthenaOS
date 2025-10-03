import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Group,
  Stack,
  Badge,
  Button,
  SimpleGrid,
  Avatar,
  ActionIcon,
  Modal,
  Divider,
  Box,
  Overlay,
  Anchor,
} from '@mantine/core';
import { TbBrandGithub, TbBrandLinkedin, TbMail } from 'react-icons/tb';

import heroImg from '../images/Team.jpg';
import './TeamPage.css';

type Member = {
  id: string;
  name: string;
  role: string;
  image?: string;
  email?: string;
  github?: string;
  linkedin?: string;
  summary: string;
  bio: string;
  skills: string[];
};

const TEAM: Member[] = [
  {
    id: '1',
    name: 'Tom Pham Chambers',
    role: 'Software Engineer',
    email: '104618232@student.swin.edu.au',
    summary: 'Leads the UI architecture, design system, and frontend performance.',
    bio: 'As a Software Engineer specializing in frontend, Tom architects the component library and ensures a consistent, accessible experience. He focuses on WCAG compliance and smooth performance to keep the chat interface fast and calming.',
    skills: ['React', 'TypeScript', 'Software Engineering', 'Accessibility'],
  },
  {
    id: '2',
    name: 'Chinmay Kho Khor',
    role: 'Frontend Developer',
    email: '104330769@student.swin.edu.au',
    summary: 'Develops user-facing features, animations, and responsive layouts.',
    bio: 'Chinmay builds and ships end-to-end features for the user interface. His work involves managing complex state, creating responsive views, and implementing motion for a friendly, therapeutic experience in collaboration with the UX team.',
    skills: ['React', 'TypeScript', 'Zustand', 'Framer Motion'],
  },
  {
    id: '3',
    name: 'Duc Thuan Tran',
    role: 'AI Engineer & Cloud Engineer',
    email: '104330455@student.swin.edu.au',
    summary: 'Manages LLM pipelines and deploys scalable AI infrastructure on the cloud.',
    bio: 'Thuan handles both the AI models and the cloud infrastructure that powers them. He designs LLM orchestration, prompt strategies, and deploys these systems on scalable cloud platforms, focusing on MLOps and efficient resource management.',
    skills: ['LLMs', 'Prompting', 'AWS/GCP', 'Terraform', 'Docker'],
  },
  {
    id: '4',
    name: 'Tien Phat Dam',
    role: 'Data Analyst, Backend Tester',
    email: '103508497@student.swin.edu.au',
    summary: 'Analytics, privacy-centric instrumentation, and insights.',
    bio: 'Phat implements privacy-first analytics to understand user outcomes without over-collecting data. He builds dashboards for engagement and well-being signals to guide ethical product iteration and improve the user experience.',
    skills: ['Analytics', 'SQL', 'Privacy', 'Data Visualization'],
  },
  {
    id: '5',
    name: 'Sehajpreet Singh',
    role: 'AI Engineer & Data Security',
    email: '104211068@student.swin.edu.au',
    summary: 'Develops secure AI features and implements data privacy and security protocols.',
    bio: 'Sehajpreet focuses on the security and integrity of the AI systems. He implements encryption, access control, and data anonymization techniques for AI data pipelines, while also researching defenses against adversarial attacks like prompt injection.',
    skills: ['AI Security', 'Python', 'Cryptography', 'Compliance', 'Data Governance'],
  },
  {
    id: '6',
    name: 'Ansh Sehgal',
    role: 'Backend Developer & QA',
    email: '104172848@student.swin.edu.au',
    summary: 'Builds core backend services and leads the quality assurance strategy.',
    bio: 'Ansh is responsible for writing clean, scalable Node.js code for the core API while also establishing the backend testing infrastructure. He writes critical integration tests and helps manage the CI/CD pipeline to ensure stable releases.',
    skills: ['Node.js', 'Prisma/ORM', 'Integration Testing', 'CI/CD'],
  },
];

export function TeamPage() {
  const [openedId, setOpenedId] = useState<string | null>(null);
  const openedMember = TEAM.find((m) => m.id === openedId) || null;

  return (
    <>
      <Box
        mx={'calc(var(--app-shell-padding) * -1)'}
        pos="relative"
        h={{ base: 360, md: 460 }}
        className="hero-section"
        style={{
          backgroundImage: `url(${heroImg})`,
        }}
      >
        <Overlay color="#000" opacity={0.2} zIndex={1} blur={3} />
        <Container size="lg" h="100%" className="hero-container">
          <Group justify="center" align="center" h="100%">
            <Card
              radius="lg"
              p={{ base: 'lg', md: 'xl' }}
              shadow="xl"
              withBorder
              className="hero-card"
            >
              <Stack gap={8}>
                <Title order={1} className="hero-title">
                  Meet the Team
                </Title>
                <Text size="lg" className="hero-text">
                  We’re a multidisciplinary group building accessible, effective, and safe
                  mental-health support with Athena.
                </Text>
                <Group gap="md" mt="xs">
                  <Anchor href="#purpose" className="hero-anchor">
                    Our purpose
                  </Anchor>
                  <Anchor href="#roadmap" className="hero-anchor">
                    Future roadmap
                  </Anchor>
                </Group>
              </Stack>
            </Card>
          </Group>
        </Container>
      </Box>

      <Container size="lg" py="xl">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {TEAM.map((m) => (
            <Card 
              key={m.id} 
              withBorder 
              radius="md" 
              p="lg" 
              shadow="sm" 
              className="team-card"
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <Stack gap="sm" style={{ flex: 1 }}>
                <Group wrap="nowrap" align="center" justify="space-between">
                  <Group gap="md" align="center">
                    {m.image ? (
                      <Avatar src={m.image} alt={`${m.name} photo`} size={64} radius="xl" />
                    ) : (
                      <Avatar color="blue" size={64} radius="xl">
                        {m.name
                          .split(' ')
                          .map((s) => s[0])
                          .join('')
                          .slice(0, 2)}
                      </Avatar>
                    )}
                    <Stack gap={0} justify="center">
                      <Title order={4} className="member-name">
                        {m.name}
                      </Title>
                      <Text size="sm" c="dimmed">
                        {m.role}
                      </Text>
                    </Stack>
                  </Group>
                  <Group gap={6}>
                    {m.github && (
                      <ActionIcon
                        component="a"
                        href={m.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="subtle"
                        aria-label="GitHub"
                      >
                        <TbBrandGithub />
                      </ActionIcon>
                    )}
                    {m.linkedin && (
                      <ActionIcon
                        component="a"
                        href={m.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="subtle"
                        aria-label="LinkedIn"
                      >
                        <TbBrandLinkedin />
                      </ActionIcon>
                    )}
                    {m.email && (
                      <ActionIcon component="a" href={`mailto:${m.email}`} variant="subtle" aria-label="Email">
                        <TbMail />
                      </ActionIcon>
                    )}
                  </Group>
                </Group>
                
                <Text size="sm" style={{ flexGrow: 1 }}>
                  {m.summary}
                </Text>
                
                <Group gap={6} mt={4}>
                  {m.skills.map((s) => (
                    <Badge key={s} variant="light">
                      {s}
                    </Badge>
                  ))}
                </Group>
                
                <Divider my="xs" />
                
                <Group justify="space-between" mt="xs">
                  <Button size="xs" variant="light" onClick={() => setOpenedId(m.id)}>
                    Read more
                  </Button>
                  {m.email && (
                    <Button size="xs" component="a" href={`mailto:${m.email}`} variant="outline">
                      Contact
                    </Button>
                  )}
                </Group>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
        <Card id="purpose" withBorder radius="md" p="lg" mt="xl" shadow="sm" className="info-card">
          <Title order={3} mb="xs" className="card-title">
            Why we created Athena
          </Title>
          <Text c="dimmed" mb="sm">
            Our purpose is to make mental-health support more accessible, especially for people who cannot easily
            reach a certified psychologist.
          </Text>
          <Stack gap={6} mt="xs">
            <Text size="sm">• Reduce access barriers with 24/7, device-agnostic support.</Text>
            <Text size="sm">• Complement (not replace) professional care with guided, evidence-informed conversations.</Text>
            <Text size="sm">• Design for safety first: trauma-sensitive UX, clear disclaimers, and crisis hand-offs.</Text>
            <Text size="sm">• Respect privacy with minimal, transparent data collection and strong safeguards.</Text>
          </Stack>
        </Card>

        <Card id="roadmap" withBorder radius="md" p="lg" mt="lg" shadow="sm" className="info-card">
          <Title order={3} mb="xs" className="card-title">
            Future progress & how we’ll get there
          </Title>
          <Stack gap="sm">
            <Group gap="xs">
              <Badge variant="light">Short-term</Badge>
              <Text size="sm" c="dimmed">
                Next 1–2 sprints
              </Text>
            </Group>
            <Stack gap={4}>
              <Text size="sm">• Finish core chat flows & safety guardrails; add in-app contact + helplines.</Text>
              <Text size="sm">• Run formative usability tests; iterate on onboarding and tone.</Text>
              <Text size="sm">• Instrument privacy-centric analytics for outcome tracking.</Text>
            </Stack>
            <Divider my="sm" />
            <Group gap="xs">
              <Badge variant="light">Mid-term</Badge>
              <Text size="sm" c="dimmed">
                2–3 months
              </Text>
            </Group>
            <Stack gap={4}>
              <Text size="sm">• Personalization improvements (history-aware goals, journaling, check-ins).</Text>
              <Text size="sm">• Evaluation harness for quality, bias, and safety regressions.</Text>
              <Text size="sm">• Content expansion: CBT/DBT-informed modules and resources.</Text>
            </Stack>
            <Divider my="sm" />
            <Group gap="xs">
              <Badge variant="light">Long-term</Badge>
              <Text size="sm" c="dimmed">
                6+ months
              </Text>
            </Group>
            <Stack gap={4}>
              <Text size="sm">• Clinician integrations and optional referrals.</Text>
              <Text size="sm">• Multi-language support and region-specific resources.</Text>
              <Text size="sm">• External audits for accessibility and AI safety.</Text>
            </Stack>
          </Stack>
        </Card>
      </Container>
      
      <Modal opened={!!openedId} onClose={() => setOpenedId(null)} title={openedMember?.name} centered>
        <Text fw={600} mb={4}>
          {openedMember?.role}
        </Text>
        <Text c="dimmed" size="sm" mb="md">
          {openedMember?.summary}
        </Text>
        <Text size="sm">{openedMember?.bio}</Text>
        {openedMember?.skills?.length ? (
          <>
            <Divider my="md" />
            <Group gap={6}>
              {openedMember.skills.map((s) => (
                <Badge key={s} variant="light">
                  {s}
                </Badge>
              ))}
            </Group>
          </>
        ) : null}
      </Modal>
    </>
  );
}

export default TeamPage;