// src/pages/TeamPage.tsx
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

// HERO background image
import heroImg from '../images/IMG_9280.jpg';

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
    role: 'Frontend Developer',
    email: '104618232@student.swin.edu.au',
    summary: 'Owns the UI layer, design system, and performance for Athena.',
    bio:
      'Tom leads the frontend architecture and component library for Athena. He focuses on accessibility (WCAG), consistent design tokens, and smooth performance across devices to keep the chat experience fast and calming.',
    skills: ['React', 'TypeScript', 'Mantine', 'Accessibility'],
  },
  {
    id: '2',
    name: 'Chinmay Kho Khor',
    role: 'Frontend Developer',
    email: '104330769@student.swin.edu.au',
    summary: 'Delivers features, animations, and responsive layouts.',
    bio:
      'Chinmay ships user-facing features end-to-end: responsive views, state management, and motion for a friendly, therapeutic UI. He collaborates closely with UX on readability and tone.',
    skills: ['React', 'TypeScript', 'Zustand/Redux', 'Framer Motion'],
  },
  {
    id: '3',
    name: 'Duc Thuan Tran',
    role: 'AI Engineer',
    email: '104330455@student.swin.edu.au', // corrected to match your note
    summary: 'Builds LLM pipelines, safety guardrails, and evaluation.',
    bio:
      'Thuan designs Athena’s LLM orchestration, prompt strategy, and retrieval flows. He maintains evaluation harnesses for quality, bias, and safety, with special focus on mental-health guardrails.',
    skills: ['LLMs', 'Prompting', 'RAG', 'Evaluation'],
  },
  {
    id: '4',
    name: 'Phat',
    role: 'Data Analyst',
    email: '103508497@student.swin.edu.au',
    summary: 'Analytics, privacy-centric instrumentation, and insights.',
    bio:
      'Phat implements privacy-first analytics to understand outcomes without over-collecting data. He builds dashboards for engagement and well-being signals to guide ethical iteration.',
    skills: ['Analytics', 'A/B Testing', 'SQL', 'Privacy'],
  },
  {
    id: '5',
    name: 'Sehajpreet Singh',
    role: 'Backend Developer',
    email: '104211068@student.swin.edu.au',
    summary: 'APIs, auth, and reliability for chat services.',
    bio:
      'Sehajpreet implements secure APIs, session management, and rate-limits. He owns CI/CD, monitoring, and error budgets to keep Athena stable and trustworthy.',
    skills: ['Node.js', 'Express', 'PostgreSQL', 'Auth'],
  },
  {
    id: '6',
    name: 'Ash',
    role: 'Backend Developer',
    email: '104172848@student.swin.edu.au',
    summary: 'Data models, integrations, and observability.',
    bio:
      'Ash designs robust data models and integrates external services (content, notifications). He improves logging/metrics to speed up debugging and ensure smooth operations.',
    skills: ['Node.js', 'Prisma/ORM', 'Caching', 'Observability'],
  },
];

export function TeamPage() {
  const [openedId, setOpenedId] = useState<string | null>(null);
  const openedMember = TEAM.find((m) => m.id === openedId) || null;

  return (
    <>
      {/* HERO */}
      <Box
        mx={'calc(var(--app-shell-padding) * -1)'}
        pos="relative"
        h={{ base: 360, md: 460 }}
        style={{
          backgroundImage: `url(${heroImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
        }}
      >
        <Overlay color="#000" opacity={0.18} zIndex={1} />
        <Container size="lg" h="100%" style={{ position: 'relative', zIndex: 2 }}>
          <Group justify="center" align="center" h="100%">
            <Card
              radius="lg"
              p={{ base: 'lg', md: 'xl' }}
              shadow="xl"
              withBorder
              style={{
                width: '100%',
                maxWidth: 760,
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                borderColor: 'rgba(255,255,255,0.7)',
                boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
                transform: 'translateY(0)',
                transition: 'transform 200ms ease, box-shadow 200ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 24px 56px rgba(0,0,0,0.32)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 18px 40px rgba(0,0,0,0.28)';
              }}
            >
              <Stack gap={8}>
                <Title
                  order={1}
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    lineHeight: 1.1,
                    color: '#0A2540',
                  }}
                >
                  Meet the Team
                </Title>

                <Text size="lg" style={{ maxWidth: 720, color: '#334155' }}>
                  We’re a multidisciplinary group building accessible, effective, and safe
                  mental-health support with Athena.
                </Text>

                <Group gap="md" mt="xs">
                  <Anchor href="#purpose" style={{ color: '#0A2540' }}>
                    Our purpose
                  </Anchor>
                  <Anchor href="#roadmap" style={{ color: '#0A2540' }}>
                    Future roadmap
                  </Anchor>
                </Group>
              </Stack>
            </Card>
          </Group>
        </Container>
      </Box>

      {/* TEAM GRID */}
      <Container size="lg" py="xl">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {TEAM.map((m) => (
            <Card key={m.id} withBorder radius="md" p="lg" shadow="sm" style={{ background: 'white' }}>
              <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                  <Group gap="md">
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
                    <div>
                      <Title order={4} style={{ lineHeight: 1.2 }}>
                        {m.name}
                      </Title>
                      <Text size="sm" c="dimmed">
                        {m.role}
                      </Text>
                    </div>
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

                <Text size="sm">{m.summary}</Text>

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

        {/* PURPOSE */}
        <Card id="purpose" withBorder radius="md" p="lg" mt="xl" shadow="sm" style={{ background: 'white' }}>
          <Title order={3} mb="xs" style={{ fontFamily: "'Playfair Display', serif" }}>
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

        {/* ROADMAP */}
        <Card id="roadmap" withBorder radius="md" p="lg" mt="lg" shadow="sm" style={{ background: 'white' }}>
          <Title order={3} mb="xs" style={{ fontFamily: "'Playfair Display', serif" }}>
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

      {/* BIO MODAL */}
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
