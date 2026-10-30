-- 062: Core Values page (Session 62, 2026-10-30). managed_pages static/values, admin-editable at
-- /pages/edit?key=static/values, listed under More. Canonical source of the values text: the
-- Institute overview (protocolized.io/pitch) pulls this page live and inlines it in its PDF.
-- Seeded from the overview draft v0.7; item 7 (Censorship-Resistance) has no description yet.
-- INSERT OR IGNORE: re-running never overwrites an admin's edits.

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'static/values', 'Core Values',
  'Thanks to our unusual origins as a program designed to build bridges between the Ethereum ecosystem and the broader world, we bring a unique sensibility to contemporary challenges. We have inherited a significant amount of DNA from the Ethereum world, in terms of values, philosophy, and research practices, but also drawn inspiration from many other communities and ecosystems.

As a result, over its four-year history, a unique set of governing values has emerged in the PI community:

1. **Commons orientation**: All our output to date has been freely published as contributions to a knowledge commons, and this will continue to be our default. Our work has also benefited from commons-based programs such as the Optimism RPGF, and GCC
2. **Obliquity**: We believe strongly in cultivating obliquity and seeking serendipity, a research philosophy based on the classic paper by Art Lindblom, *The Art of Muddling Through*.
3. **Scene-Making**: We believe in going beyond basic research to applications, teaching, cultivating literacy, and broad evangelism aimed at establishing protocols as first-class objects of study, analysis, and synthesis
4. **Openness and Collaboration**: Over the years we have conducted a significant fraction of our work in collaboration with varied partner organizations. We believe in influencing and being influenced.
5. **Plurality**: We believe our approach to protocol studies is not the only possible one, and that protocols are not the only aspect of the problems we study that are worthy of attention. We strive to cultivate a pluralist ecology of ideas and practices in everything we do.
6. **Permissionlessness**: PI fosters a strong ethos of permissionless participation, and designs infrastructures and operational models that allow for any curious and interested individual or organization to participate.
7. **Censorship-Resistance**: *Description to come.*
8. **Subsidiarity**: We believe in devolving autonomy and agency to the lowest level that makes sense, and operate with decentralized mechanisms and patterns as much as possible.
9. **Cosmopolitanism**: Our program activities have taken us to a dozen cities across four continents, and we have program alumni around the world. We strive hard to make our work and opportunities accessible to individuals anywhere in the world
10. **Planetary Thinking**: PI fosters a strongly planetary rather than worldly orientation in thinking about how technology should be built and deployed in the world, with a perspective that encompasses nature and wildernesses, bioregions, and non-human species.',
  '2026-10-30T00:00:00.000Z', 'system', 1
);
