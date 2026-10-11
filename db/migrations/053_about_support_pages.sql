-- 053: About and Support Us become admin-editable markdown pages (Session 57, 2026-10-10).
--
-- managed_pages static/about and static/support, rendered by js/managed-page.js
-- and edited by admins at /pages/edit?key=static/about (or static/support). The
-- HTML pages keep the same text as a fallback for when the fetch fails.
--
-- About is also refreshed for this session's changes: Research Groups and
-- Research Leads, the 2027 Research Roadmap, Projects, PiBoWriMo, Monstrous Times,
-- PIBot/Humboldt, Core and Extended Team, the Network. Support Us is converted
-- as it stood. INSERT OR IGNORE: re-running never overwrites an admin's edits.

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/about', 'About',
  'The Protocol Institute is an independent research, education, and scene-making organization dedicated to the study of protocols — the rules, procedures, technologies, and coordination infrastructures that shape how individuals, organizations, and systems interact and co-evolve. In particular, we are interested in the contemporary evolution of planet-scale intelligence through the interplay of AI, modern cryptographic technologies like blockchains, and their physical embodiments, as well as the human ecologies that emerge on top of them.

<p class="about-logo"><img src="/assets/logo-static.png" alt="The Protocol Institute"></p>

The Institute evolved from the **Summer of Protocols**, a research program funded by the Ethereum Foundation that ran from 2023 to 2024. The program brought together over eighty researchers across multiple disciplines — from philosophy and organizational theory to cryptography and urban infrastructure — to investigate the deep structure of protocols as a category. It operated across multiple research tracks, supported independent scholars, and produced over 270 published works spanning essays, papers, tools, datasets, and works of fiction. Materials inherited from this program, as well as new materials, are published on our media hub companion site, [Protocolized](https://protocolized.io), and disseminated through our [Substack newsletter](https://protocolized.summerofprotocols.com). The protocol fiction first developed there has since been spun out as an independent magazine, [Monstrous Times](https://monstroustimes.com).

## What we do

Today, the Protocol Institute carries that work forward through research, publishing, events, and education:

- **[Research Groups](/research-groups)** — focused, renewably chartered groups that meet regularly, develop expertise on specific protocol themes, and take on time-bound research projects. The projects they propose for the coming year are collected in the [Research Roadmap 2027](/programs/research-roadmap/2027).
- **[Projects](/research)** — research projects led by our members, alongside the open challenges they respond to.
- **[Events](/events)** — symposia, workshops, and gatherings, including [PiBoWriMo](/events/pibowrimo-2026), our book-writing month. Recordings from the [Protocol Symposium 2026](/events/protocol-symposium-2026) are online.
- **Publishing** — [Protocolized](https://protocolized.io), with its newsletter, books, and resource archive.
- **AI research systems** — [PIBot](/projects/project?slug=c3po), a research assistant built on the Institute''s corpus, and [Humboldt](/humboldt), an autonomous research agent.

The [Programs](/programs) page maps all of our activities, and partner organizations are listed in the [Protocol Institute Network](/network).

## People

PI is run by a small [Core Team](/members?filter=team), working with an [Extended Team](/members?filter=extended_team) of editors, collaborators, and AI systems. Our [Research Leads](/members?filter=community_lead) host the research groups, [Researchers](/members?filter=tag_sig) take part in them, and an active [Discord community](https://discord.gg/Aj5FbGsNYV) connects everyone. The full [member directory](/members) has more.

## Supporting our work

We are in the process of spinning out of the Ethereum Foundation as an independent entity, and are now seeking support, including funding for the projects in the Research Roadmap 2027. The [Support Us](/support) page has details on the various ways you can support our work.

<p class="about-footnote">Research outputs from the Summer of Protocols 2023 are published under a <a href="/license">CC+ license</a> that transitions from CC BY-NC 4.0 to CC BY 4.0 on December 13, 2026.</p>
',
  datetime('now'), 'migration-053', 1);

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/support', 'Support Us',
  'The Protocol Institute is an independent research organization currently supported by the Ethereum Foundation through the end of 2026. We are in the process of spinning out as a Canada-based nonprofit. We are currently actively seeking new sources of support, and will be able to formally accept funding starting in Fall 2026. We aim to raise between $500,000-$1.5 million over the next 6-12 months, through a variety of means, and have prepared a range of corresponding plans for 2027 activities, corresponding to different funding levels. There are several ways you will be able to support us financially in the coming year, at various levels, from individual to institutional:

- **Buy our books**: We will shortly offer several of our publications for sale in print editions. These will be available in the [Books](https://protocolized.io/books) section of the companion [Protocolized](https://protocolized.io) site.
- **Substack**: Our [Substack](https://protocolized.summerofprotocols.com) will shortly offer paid subscriptions. You can pledge support right now.
- **Attend ticketed events**: These will be announced on our [Substack](https://protocolized.summerofprotocols.com) as usual.
- **Hire from our consultant network**: Many PI members offer their protocol expertise for consulting projects, including at pro-bono and special discounted rates for projects aligned with the PI mission. Browse our [Consultants](/members?filter=consultant) page to identify and hire experts who might be right for your needs.
- **Support our Partner Organizations**: We aim to catalyze support beyond the Protocol Institute for the larger ecosystem of organizations working on protocols. Support our partner organizations in the [Protocol Institute Network](/network).
- **Hire us for research projects**: PI has experienced in-house research leadership and a deep bench of researchers we can draw on from our alumni network. If you have a research project suited to our capabilities, reach out to Director of Research, Venkatesh Rao, at [venkat@protocol-institute.org](mailto:venkat@protocol-institute.org).
- **Grassroots Funding Drives**: We will shortly roll out grassroots funding mechanisms allowing us to accept small grants from individual supporters. Support us through these drives.
- **Grant Funding**: Finally, we will shortly begin soliciting grant funding from institutional sources and high-net-worth individuals. Please reach out to Managing Director Timber Stinson-Schroff at [timber@protocol-institute.org](mailto:timber@protocol-institute.org).
',
  datetime('now'), 'migration-053', 1);
