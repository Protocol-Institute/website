-- 057: the rest of the site's hand-written text becomes admin-editable markdown
-- (Session 58, 2026-10-11). Same mechanism as 053 (About, Support Us): managed_pages
-- rows under static/, edited by admins at /pages/edit?key=<key>.
--
-- Whole pages (one block, Edit link in the page header): home, contact, network,
-- workshops, humboldt, license, consulting-policies. Intro blocks on index pages
-- (a small Edit link on the block): research-groups, events-calendar,
-- events-calendar-note, events-history, research, research-projects,
-- research-challenges, programs, members, and one blurb per members filter
-- (members-<filter>, underscores as hyphens). All rendered by js/page-blocks.js;
-- the pages keep the same text in their HTML as the fallback.
--
-- Seeded mechanically from each page's HTML at this commit. Elements that carry
-- a class (the home banner and notice, the contact email) stay as raw HTML in
-- the markdown so they keep their styling. Network cards are written as one
-- "### Org" section each (logo image, *parent*, description, "Contact: ...");
-- network/index.html rebuilds the card grid from that.
-- INSERT OR IGNORE: re-running never overwrites an admin's edits.

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/home', 'Home',
  '<a class="home-banner" href="/events/pibowrimo-2026/"> <span class="home-banner-title">PiBoWriMo 2026</span> <span class="home-banner-text">The Protocol Institute Book Writing Month<br/><span class="nowrap">November 1–30</span></span> <span class="home-banner-cta">Sign up here →</span> </a>

<p class="home-notice"><span class="home-notice-tag">New!</span> Protocol Symposium videos are now available — <a class="nowrap" href="/events/protocol-symposium-2026/">check them out here →</a></p>

<div class="about-body">

The Protocol Institute is a research, education, media, and scene-making organization dedicated to advancing protocols and protocolization worldwide.

</div>

<div class="home-explore">

Explore PI''s activities:

- [Projects](/research) — community research projects and open challenges
- [Research Groups](/research-groups) — ongoing working groups on active protocol research topics
- [Research Roadmap 2027](/programs/research-roadmap/2027) — the projects our research groups propose for 2027
- [Protocolized](https://protocolized.io) — PI''s magazine on protocols and protocolization
- [Protocol Symposium 2026](/events/protocol-symposium-2026/) — recordings and transcripts from September''s symposium on New Nature
- [Discord](https://discord.gg/Aj5FbGsNYV) — join the PI community conversation

</div>',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/contact', 'Contact',
  '<div class="contact-body">

<p class="contact-intro">For inquiries, collaboration proposals, or general correspondence:</p>

<a class="contact-email" href="mailto:team@protocol-institute.org">team@protocol-institute.org</a>

<div class="contact-note">

We read every message and respond when we can. For time-sensitive matters, please note that response times vary.

</div>

</div>',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/network', 'Network',
  'The Protocol Institute Network (PIN) is a collaborative network of institutional groups actively working on the many challenges of protocolization.

These include university research groups, private corporations, civic and governmental agencies, and nonprofits. PIN is meant to be a network of smaller units actively working on protocol-related projects and initiatives, with a clearly designated point of contact who is committed to being an active participant, rather than the parent organizations themselves.

If you''re interested in having your group join the network, please share a few brief details via [this form](https://forms.gle/GSfoXsXAREcapxwj7). You are also welcome to browse the PIN channel on our [Discord](https://discord.gg/Aj5FbGsNYV), and contact [Venkatesh Rao](mailto:team@protocol-institute.org), Director of Research, with any questions.

### [ProSoDiAC Lab](https://prosodiac.github.io)

![ProSoDiAC lab](/assets/network/prosodiac.svg)

*University of Messina*

Teaching and applied research at the intersection of protocol thinking, Cyber-Physical Systems, and Agentic AI. Areas include Industrial IoT, Software-Defined Robotics, and the Infrastructure Continuum.

Contact: Giovanni Merlino, Associate Professor of Computer Science Engineering

### [Protopolis Lab](https://protopol.is)

*NYU Shanghai*

Studies, diagnoses, and builds protocols for collective life in a world of humans, institutions, and autonomous systems. Research areas: Civic Protocols & Collective Governance; Embodied Urban Futures; AI Governance & Agentic Systems; Trust Experience Design.

Contact: Helena Rong, Assistant Professor and Co-Area Head, Interactive Media and Business

### Innovation Unit, Metropolitan Water District of Southern California

![MWD Innovates](/assets/network/mwd.svg)

Contact: Patrick Atwater, Innovation Manager

### [Princeton Human-Computer Interaction Lab](https://hci.princeton.edu/)

![Princeton HCI Lab](/assets/network/princeton-hci.png)

*Princeton University*

Decentralization through Protocolization.

Contact: Andrés Monroy-Hernández, Associate Professor

### [Monstrous Times](https://monstroustimes.com)

*Spun out of Protocolized, 2026*

“The Magazine of Strange Rules” — a protocol fiction magazine about agents, humanoid and otherwise, living in strange rules environments, especially where older systems are breaking down and new ones are still taking shape. Publishes story series, standalone stories and essays, both entirely human-written and crafted with AI. The genre was developed in the fiction Protocolized published, which the magazine now carries on independently.

Contact: Sachin Benny, Editor in Chief',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/workshops', 'Corporate Workshops',
  '<div class="members-intro">

The Protocol Institute offers seminars and workshops on protocol thinking for organizations in select sectors, led by Institute directors. These are offered on a pro bono basis to a limited number of organizations per year.

</div>

<div class="symposium-submissions">

## Format

### Initial Seminar

A 60–90 minute virtual seminar on protocol thinking covering foundational research, practical concepts, and case studies drawn from two years of accumulated work. Content is customized based on organizational context and needs.

### Extended Workshop

Organizations with continued interest can participate in a half-day, in-person workshop held at their location. These sessions allow for deeper exploration of specific application areas and may include subject matter experts from the PI research community.

## Facilitators

**Venkatesh Rao** leads sessions for organizations in semiconductors, hard tech, engineering, programmable cryptography, and technology.

**Timber Stinson-Schroff** facilitates sessions for organizations in government, natural resources, and health & safety.

## Request a Workshop

To request a seminar or workshop, contact [team@protocol-institute.org](mailto:team@protocol-institute.org) with a brief description of your organization and why protocol thinking is relevant to your work.

</div>',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/humboldt', 'Humboldt',
  '<div class="about-body">

Autonomous research agent investigating the new nature — the laws and patterns of protocolized systems. Humboldt draws on the PIBot corpus and external sources to conduct independent inquiry into long-horizon research questions posed by the Protocol Institute.

<p style="margin-top:1.25rem"> <a href="https://humboldt.protocol-institute.org" rel="noopener noreferrer" target="_blank">humboldt.protocol-institute.org</a><span class="external-badge">external</span> </p>

<p style="margin-top:1.5rem"><a class="back-link" href="/programs">← Programs</a></p>

</div>',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/license', 'CC+ License',
  '<div class="members-intro">

The Summer of Protocols 2023 collective work implements a dual-licensing model that transitions over time. This page documents the licensing terms for SoP23 research outputs published by the Ethereum Foundation.

</div>

<div class="symposium-submissions">

## License Structure

All articles in the Summer of Protocols 2023 collection are governed by a two-phase licensing arrangement:

### Initial Phase — until December 13, 2026

Articles are licensed under **CC BY-NC 4.0** (Creative Commons Attribution–NonCommercial 4.0 International). Attribution is required; commercial use is not permitted without a separate agreement.

### Transition Phase — from December 13, 2026

Licensing automatically shifts to **CC BY 4.0** (Creative Commons Attribution 4.0 International). Commercial use is permitted with attribution only. The publisher commits that the license will never become more restrictive than the initial CC BY-NC 4.0 terms at any point before or after the transition date.

## Scope and Parties

<ul style="margin:0 0 1.5rem 1.25rem;line-height:1.8;"> <li><strong>Publisher:</strong> Stifung Ethereum (Ethereum Foundation)</li> <li><strong>Licensors:</strong> Individual article authors</li> <li><strong>Scope:</strong> Individual articles within the Summer of Protocols 2023 collection</li> </ul>

## Commercial Use Before December 13, 2026

Commercial use of SoP23 articles prior to the Change Date requires a separate licensing agreement from the respective author or an authorized reseller. Contact [team@protocol-institute.org](mailto:team@protocol-institute.org) to inquire.

## Exclusions

This license applies to individual articles and derivative works of individual articles. It does not cover the collective work itself, which remains the publisher''s intellectual property. Trademark and logo rights are explicitly excluded from this licensing arrangement.

</div>',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/consulting-policies', 'Consulting Network Policies',
  '<div class="draft-banner">

This page is a stub. Full policies will be published here before the consulting directory is widely promoted.

</div>

The PI Consulting Network lists Protocol Institute members who are available for consulting engagements related to protocol research, design, and implementation. Listing in the directory is a privilege extended to members in good standing.

## Eligibility

Any approved PI member may opt into the consulting directory when applying for membership, or at any time by contacting the team. A profile photo and areas of expertise are required for a listing to appear publicly.

## Standards of conduct

Members listed in the consulting directory are expected to:

- Represent their expertise and affiliation with the Protocol Institute accurately.
- Conduct engagements professionally and in good faith.
- Not use their PI affiliation to make claims or commitments on behalf of the Institute.
- Notify the PI team if they are no longer available for engagements.

## Removal

PI may remove a member from the consulting directory at its discretion, including for conduct inconsistent with the above standards. Removal from the directory does not affect PI membership status.

## Contact

Questions about the consulting network or these policies: [team@protocol-institute.org](mailto:team@protocol-institute.org).',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/events-calendar', 'Events — Calendar intro',
  'Research group meetings and Institute events coming up, soonest first. Use a listing''s calendar link to add just that event.',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/events-calendar-note', 'Events — Calendar note',
  'To add an event to the community calendar, organize it on your personal calendar, invite [sigs@protocol-institute.org](mailto:sigs@protocol-institute.org) to it, and make a Discord event for it if appropriate. Contact Timber for any issues.',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/events-history', 'Events — History intro',
  'Symposia, workshops, and residential gatherings organized by the Protocol Institute and its predecessor program, the Summer of Protocols.',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/research', 'Projects — intro',
  'Community projects that extend a research group''s work, respond to an open challenge, or stand independently — alongside open research challenges in the spirit of Erdős problems and Grand Challenges: problems worth making progress on, not problems to be closed.

For the projects our research groups propose for 2027, see the [Research Roadmap 2027](/programs/research-roadmap/2027).',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/research-projects', 'Projects — Projects tab intro',
  'Projects that produce specific artifacts — documents, tools, websites, or other outputs — led by an individual or a team, aligned with a research group or independent.',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/research-challenges', 'Projects — Challenges tab intro',
  'Logged in PI members can add problems. If you''re not a member, you can [email a member](mailto:team@protocol-institute.org) to suggest a problem.',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/programs', 'Programs — intro',
  'The Institute''s work is organized into **areas**, each holding **programs** — research groups, initiatives, events, workshops and courses. Each program has its own page listing its editions and the projects tagged to it.',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/members', 'Members — intro',
  'Participants in the Protocol Institute ecosystem — researchers, practitioners, and collaborators who have taken part in PI programs and activities. Membership is available to individuals who have participated in qualifying PI events.',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/research-groups', 'Research Groups — intro',
  'Research Groups are professional-led cohorts that meet biweekly to discuss, design, and theorize on topics at the frontier of protocol research. Each group is focused on an area that has shown particular promise for advancing the study of protocols. New members are welcome — join the Discord and introduce yourself before attending a session.',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/members-team', 'Members — Team blurb',
  'The Protocol Institute''s core team. For general inquiries, email [team@protocol-institute.org](mailto:team@protocol-institute.org).',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/members-extended-team', 'Members — Extended Team blurb',
  'Editors, collaborators and AI systems who work alongside the core team on the Institute''s programs.',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/members-community-lead', 'Members — Research Leads blurb',
  'Members who lead PI research activities, currently as Research Group hosts.',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/members-consultant', 'Members — Consultants blurb',
  'PI members available for consulting on protocol design, governance, organizational protocolization, and strategy. Enquire directly with individual consultants. [Consulting network policies →](/consulting/policies)',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/members-tag-sop23', 'Members — SoP ''23 blurb',
  'Fellows from the Summer of Protocols 2023 cohort — PI''s inaugural grant program in protocol research.',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/members-tag-sop24', 'Members — SoP ''24 blurb',
  'Fellows from the Summer of Protocols 2024 cohort, exploring protocolization across institutions, markets, and culture.',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/members-tag-sop25', 'Members — SoP ''25 blurb',
  'Fellows from the Summer of Protocols 2025 cohort, investigating protocols in new nature and infrastructure.',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/members-tag-ps25', 'Members — Protocol School 2025 blurb',
  'Graduates of Protocol School 2025 — PI''s intensive program in protocol theory and practice.',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/members-tag-sig', 'Members — Researchers blurb',
  'Members who take part in Protocol Institute Research Groups — ongoing focused research and practice communities.',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/members-tag-symposium-25', 'Members — Symposium 2025 blurb',
  'Attendees of the 2025 Protocol Foundations Workshop — PI''s annual symposium on protocol research.',
  datetime('now'), 'migration-057', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/members-tag-guest-speaker', 'Members — Guest Speakers blurb',
  'Individuals who have appeared as guest speakers at Protocol Institute events.',
  datetime('now'), 'migration-057', 1);
