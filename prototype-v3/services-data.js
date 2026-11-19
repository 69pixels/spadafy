/* =========================================================
   Spadafy — Services page content (tabs and case studies).
   Adding or changing a tab card or a case is a data change only.
   ========================================================= */

/* "We're the Whole Package": every group's cards sit in one row; the toggle shows which group you're on.
   accent: the token the toggle highlight takes for that group. A group with no cards gets placeholders.
   title: a string wraps naturally; an array forces a line break between items. */
window.SERVICE_TABS = [
  {
    id: 'core', label: 'Core VDI', accent: 'orange',
    cards: [
      { title: ['VDI Managed', 'Services'], text: 'We run your VDI day to day, or add engineers to your team', img: 'assets/services/card-managed.jpg', href: 'vdi-managed-services.html' },
      { title: ['VDI', 'Infrastructure'], text: 'Design, build, refresh or migrate a VDI environment', img: 'assets/services/card-infra.jpg', href: 'vdi-infrastructure.html' },
      { title: ['Free VDI', 'Health Check'], text: 'A free review of your current environment', img: 'assets/services/card-health.jpg', href: 'free-vdi-health-check.html' }
    ]
  },
  {
    id: 'beyond', label: 'Beyond VDI', accent: 'pink',
    cards: [
      { title: 'Healthcare SSO and Authentication', text: 'Fast, secure clinician sign-in with Imprivata', img: 'assets/services/card-sso.jpg', href: 'healthcare-sso.html' },
      { title: 'Hybrid Cloud & Infrastructure Modernization', text: 'Data center, cloud, migration, backup and recovery', img: 'assets/services/hero.jpg', href: 'hybrid-cloud.html' },
      { title: 'IGEL Endpoint Solution', text: 'Manage user devices centrally and reuse existing hardware', img: 'assets/services/card-igel.jpg', href: 'igel-endpoint-solutions.html' },
      { title: 'Nerdio Solutions', text: 'Automate Azure Virtual Desktop, Windows 365 and Intune, control cloud costs', img: 'assets/services/card-nerdio.jpg', href: 'nerdio-solutions.html' }
    ]
  }
];

// DRAFT placeholder content: replace with real, approved client engagements before launch
window.CASE_STUDIES = [
  {
    sector: 'Healthcare',
    title: 'A hospital’s small EUC team hands over day-to-day VDI',
    img: 'assets/services/hero.jpg',
    problem: 'Two engineers supporting Citrix for 3,000 clinicians, constant firefighting.',
    did: 'Full Managed Services: monitoring, patching, Level 2/3 support, vendor escalations.',
    result: 'Fewer user tickets, planned upgrades on time, the team back on projects.'
  },
  {
    sector: 'Financial Services',
    title: 'A wealth manager moves from ageing on-prem VDI to Omnissa Horizon',
    img: 'assets/services/case-2.jpg',
    problem: 'End-of-life hardware, slow logons and an audit deadline approaching.',
    did: 'VDI Health Check, new architecture design, phased migration of 1,200 users with zero trading-hours downtime.',
    result: 'Logon times cut by more than half, audit passed, and a clear refresh roadmap.'
  },
  {
    sector: 'Education',
    title: 'A university gives students lab software on any device',
    img: 'assets/img/service.jpg', // TODO: placeholder image, replace with the real case image
    problem: 'Physical labs at capacity and specialist apps tied to campus PCs.',
    did: 'Designed and deployed a GPU-backed virtual app platform with SSO and scaling around term-time peaks.',
    result: 'Lab apps available 24/7 off campus, fewer physical machines, and costs that follow demand.'
  },
  {
    sector: 'Legal',
    title: 'A law firm’s IT team gets senior VDI engineers on retainer',
    img: 'assets/img/service-2.jpg', // TODO: placeholder image, replace with the real case image
    problem: 'An in-house team without deep Citrix expertise and a backlog of upgrades.',
    did: 'Retainer Services: monthly engineering hours for upgrades, troubleshooting and escalations.',
    result: 'Backlog cleared in one quarter and a stable platform through the firm’s busiest period.'
  },
  {
    sector: 'Manufacturing',
    title: 'A manufacturer secures remote access for plant and office staff',
    img: 'assets/img/service-3.jpg', // TODO: placeholder image, replace with the real case image
    problem: 'Mixed thin clients, shared logins on the factory floor and a security review flagging risk.',
    did: 'IGEL endpoint rollout, Imprivata badge-tap SSO, and session policies hardened to the security baseline.',
    result: 'Fast shared-workstation logons, removal of shared credentials, and a closed security finding.'
  }
];
