import { useState } from 'react';
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Container,
  Stack,
  Tabs,
  Loader,
  Center
} from '@mantine/core';
import { loginUser, registerUser } from '../services/apiService';
import { useAuthStore } from '../context/authStore';
import './LoginPage.css'; // custom styles

export function LoginPage() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const loginAction = useAuthStore((state) => state.login);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const data = await loginUser(loginEmail, loginPassword);
      loginAction(data.token);
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed!');
      setIsLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await registerUser(registerUsername, registerPassword, registerEmail);
      alert('Registration successful! Please log in.');
      setIsLoading(false);
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed!');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Center style={{ height: '100vh' }}>
        <Loader size="lg" color="blue" />
      </Center>
    );
  }

  return (
    <div className="login-page">
      <Container size={420} my={40} className="fade-in">
        <Title className="login-title">Welcome to AthenaOS</Title>

        <Paper withBorder shadow="lg" className="login-card">
          <Tabs defaultValue="login">
            <Tabs.List grow>
              <Tabs.Tab value="login">Sign In</Tabs.Tab>
              <Tabs.Tab value="register">Sign Up</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="login" pt="xs">
              <form onSubmit={handleLogin}>
                <Stack>
                  <TextInput
                    required
                    label="Email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.currentTarget.value)}
                  />
                  <PasswordInput
                    required
                    label="Password"
                    placeholder="Your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.currentTarget.value)}
                  />
                  <Button type="submit" fullWidth className="glow-button">
                    Sign in
                  </Button>
                </Stack>
              </form>
            </Tabs.Panel>

            <Tabs.Panel value="register" pt="xs">
              <form onSubmit={handleRegister}>
                <Stack>
                  <TextInput
                    required
                    label="Username"
                    placeholder="Your username"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.currentTarget.value)}
                  />
                  <TextInput
                    required
                    label="Email"
                    placeholder="your@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.currentTarget.value)}
                  />
                  <PasswordInput
                    required
                    label="Password"
                    placeholder="Your password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.currentTarget.value)}
                  />
                  <Button type="submit" fullWidth className="glow-button">
                    Sign up
                  </Button>
                </Stack>
              </form>
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Container>
    </div>
  );
}
