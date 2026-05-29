# Google Form Sheets — Update Guide

Two Google Forms feed data into manually-maintained HTML pages. When new responses arrive, run the fetch script, review the output, then update the relevant page by hand.

## Sheets

| Page | Google Sheet | Form link (on page) |
|------|-------------|---------------------|
| `/network` | [PIN form responses](https://docs.google.com/spreadsheets/d/1HtK0_DennkrcAFcsTLbAWXduqSlgkfKczijPpMVv_e0) | forms.gle/GSfoXsXAREcapxwj7 |
| `/consulting` | [Consulting form responses](https://docs.google.com/spreadsheets/d/11jpKf7ShOBdj-UWseLcC9HVLNOq740FXhRaPbNSAv_s) | forms.gle/YC2wrVwVnGFpiZq19 |

Both sheets are public (anyone with link). No authentication needed.

## Fetch script

```bash
python3 fetch_form_data.py              # both sheets
python3 fetch_form_data.py --network    # network only
python3 fetch_form_data.py --consulting # consulting only
```

This prints a structured summary of every form response. Compare the output against the existing cards in `network/index.html` or `consulting/index.html` to identify new or changed entries.

## Update workflow

### Network page (`network/index.html`)

Each form response maps to one `.network-card`. Fields used:

| Form field | Card element |
|-----------|-------------|
| Unit name | `.network-org` (linked to website) |
| Parent organization | `.network-parent` |
| Work description | `.network-desc` (edit to ~2 sentences) |
| Contact name + title | `.network-contact` |
| Logo URL | Download to `assets/network/<slug>.svg` and use as `<img>` |

**Logo handling:** Download the logo locally rather than hotlinking — external SVGs can change or disappear. Save to `assets/network/` with a short slug (e.g. `prosodiac.svg`, `mwd.svg`).

**Card template:**
```html
<div class="network-card">
  <div class="network-logo">
    <img src="/assets/network/<slug>.svg" alt="<Unit name>">
  </div>
  <div class="network-org"><a href="<website>"><Unit name></a></div>
  <div class="network-parent"><Parent org></div>
  <div class="network-desc"><2-sentence description></div>
  <div class="network-contact">Contact: <Name>, <Title></div>
</div>
```

### Consulting page (`consulting/index.html`)

Each form response maps to one `.consulting-card`. Fields used:

| Form field | Card element |
|-----------|-------------|
| Name | `.consulting-name` |
| Background / expertise | `.consulting-expertise` (distill to keyword tags) |
| Portfolio / public contact URL | `.consulting-contact` link |
| Photo URL | Download to `assets/beings/<slug>.jpg` |

**Photo handling:** Photos go in `assets/beings/`. If the form response says "will email", wait for the photo before adding the card (or use `.consulting-photo--placeholder` in the interim).

**Card template:**
```html
<div class="consulting-card">
  <div class="consulting-photo">
    <img src="/assets/beings/<slug>.jpg" alt="<Name>">
  </div>
  <div class="consulting-details">
    <div class="consulting-name"><Name></div>
    <div class="consulting-expertise"><Tag1> · <Tag2> · <Tag3></div>
    <div class="consulting-contact">Contact: <a href="<url>"><url></a></div>
  </div>
</div>
```

## Notes

- Cards with incomplete data (no photo, no logo yet) can use placeholder markup and be updated when assets arrive.
- Patrick Atwater (MWD Innovation Unit) is on the network page but has not submitted the form — his card was added manually.
- Neither sheet captures a "remove me" signal — deletions must be handled manually.
