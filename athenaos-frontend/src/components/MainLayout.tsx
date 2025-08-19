// src/components/MainLayout.tsx

import { Link, Outlet } from 'react-router-dom';
import { AppShell, Group, Container, Text } from '@mantine/core';
import classes from './MainLayout.module.css';

export function MainLayout() {
  return (
    <AppShell header={{ height: 80 }} padding="md">
      <AppShell.Header
        withBorder={false}
        style={{ borderBottom: '1px solid #e0e0e0' }}
      >
        <Container size="lg" h="100%">
          {/* ... code cho navbar giữ nguyên ... */}
          <Group justify="space-between" h="100%" className={classes.desktopNav}>
            <Link to="/" className={classes.link}>Home</Link>
            <Link to="/services" className={classes.link}>Services</Link>
            <Link to="/blog" className={classes.link}>Blog</Link>
            <Text component={Link} to="/" size="xl" style={{ fontFamily: "'Playfair Display', serif", border: '1px solid black', padding: '5px 15px' }}>
              AthenaOS
            </Text>
            <Link to="/team" className={classes.link}>About Us</Link>
            <Link to="/contact" className={classes.link}>Contact</Link>
            <Link to="/login" className={classes.link}>Login</Link>
          </Group>
          <Group h="100%" justify="space-between" className={classes.mobileNav}>
             <Text component={Link} to="/" size="xl" style={{ fontFamily: "'Playfair Display', serif" }}>
               
             </Text>
          </Group>
        </Container>
      </AppShell.Header>

      {/* THÊM THUỘC TÍNH `bg` VÀO DÒNG DƯỚI ĐÂY */}
      <AppShell.Main bg="#F8F7F4">
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}