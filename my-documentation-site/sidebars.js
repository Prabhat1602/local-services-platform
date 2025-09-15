/**
 * @typedef {import('@docusaurus/plugin-content-docs').SidebarConfig} SidebarConfig
 */

/** @type {SidebarConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro', // Your introductory page

    {
      type: 'category',
      label: '1. Software Requirements Specification (SRS)',
      link: { type: 'doc', id: '1-srs/index' },
      items: [
        '1-srs/functional-requirements',
      ],
    },
    {
      type: 'category',
      label: '2. System Design',
      link: { type: 'doc', id: '2-system-design/index' },
      items: [
        '2-system-design/er-diagram',
        '2-system-design/uml-diagrams',
        '2-system-design/wireframes',
      ],
    },
    {
      type: 'category',
      label: '3. Core Features',
      link: { type: 'doc', id: '3-features/index' },
      items: [
        '3-features/user-registration',
        '3-features/service-management',
        '3-features/service-booking',
        '3-features/payments',
        '3-features/chat-notifications',
        '3-features/feedback-support',
        '3-features/admin-dashboard',
      ],
    },
    {
      type: 'category',
      label: '4. API Reference',
      link: { type: 'doc', id: '4-api-reference/index' },
      items: [
        '4-api-reference/auth-api',
        '4-api-reference/services-api',
        '4-api-reference/bookings-api',
        '4-api-reference/users-api',
        '4-api-reference/payments-api',
        '4-api-reference/chat-api',
        '4-api-reference/notifications-api',
        '4-api-reference/feedback-api',
      ],
    },
    '5-deployment',
    '6-future-enhancements',
  ],
};

module.exports = sidebars;
