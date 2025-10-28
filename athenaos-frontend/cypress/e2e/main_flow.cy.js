describe('Main Application Flow', () => {
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'password123',
  };

  before(() => {
    cy.request('POST', 'http://localhost:8888/api/auth/register', {
      username: testUser.username,
      email: testUser.email,
      password: testUser.password,
    });
  });

  it('should allow a user to log in, send a message, and see a response', () => {
    cy.visit('/');

    cy.contains('Learn more about the technology', { timeout: 10000 })
      .should('be.visible')
      .click();

    cy.contains('Sign In').click();

    cy.url().should('include', '/login');

    cy.get('input[placeholder="your@email.com"]')
      .filter(':visible')
      .type(testUser.email);

    cy.get('input[placeholder*="Minimum 6 characters"]')
      .filter(':visible')
      .type(testUser.password);

    cy.get('button[type="submit"]')
      .filter(':visible')
      .contains('Sign in')
      .click();

    cy.url().should('not.include', '/login');
    cy.contains('Logout').should('be.visible');

    cy.get('button[aria-label="Toggle sidebar"]').click();
    cy.get('a[href="/chat"]').click();

    cy.contains('AthenaAI Chat').should('be.visible');

    cy.get('button').contains('New Chat').click();

    const userMessage = 'Hello Athena, how are you today?';
    cy.get('input[placeholder="Type your message..."]').type(userMessage);
    cy.get('button[type="submit"]').contains('Send').click();

    cy.contains(userMessage).should('be.visible');

    cy.get('div[class*="Paper-root"]', { timeout: 20000 })
      .should('have.length.at.least', 2);
  });
});