// Protocol Institute — shared SIG metadata (Discord channels, full names) + calendar link helpers.
// Canonical source for channel ids/names: ../c3po/config/discord_channels.json.
// Consumed by main.js (SIG schedule blocks on /sigs) and events/index.html (Calendar tab).
window.PI_SIGS = {
  sigfpt:    { full: 'Formal Protocol Theory', channelId: '1327337414175490160', channelName: 'formal-protocol-theory' },
  mrg:       { full: 'Memory Research Group', channelId: '1379992696114122832', channelName: 'memory-research-group' },
  sigpfb:    { full: 'Protocols for Business', channelId: '1333851496416153702', channelName: 'protocols-for-business' },
  protfisig: { full: 'Protocol Fiction', channelId: '1106572787042238504', channelName: 'protocol-fiction' },
  drg:       { full: 'Distributed Robotics Group', channelId: '1508175637020676259', channelName: 'distributed-robotics' },
  sigpsy:    { full: 'Special Interest Group in Psychohistory', channelId: '1508205168661893180', channelName: 'psychohistory' }
};
window.PI_DISCORD_GUILD_ID = '1082444651946049567';
window.PI_GCAL_COMMUNITY = 'https://calendar.google.com/calendar/u/0?cid=c2lnc0Bwcm90b2NvbC1pbnN0aXR1dGUub3Jn';
window.PI_GCAL_INSTITUTE = 'https://calendar.google.com/calendar/u/0?cid=Y18zOTA2NGJkMzQ2OTU0YjczODM1NTQ1YzIxZGQxM2Y4MTI3MDBiNDRjMGZiYjA3MjNmMzkwMjExNDczZGRlZDVjQGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20';

function pad2(n) { return String(n).padStart(2, '0'); }

window.PI_gcalStamp = function (d) {
  return d.getUTCFullYear() + pad2(d.getUTCMonth() + 1) + pad2(d.getUTCDate()) + 'T' +
    pad2(d.getUTCHours()) + pad2(d.getUTCMinutes()) + pad2(d.getUTCSeconds()) + 'Z';
};

// Single-occurrence "add to calendar" link for a SIG meeting (1hr duration, matches the .ics series files).
window.PI_sigGcalLink = function (slug, next) {
  var sig = window.PI_SIGS[slug];
  if (!sig) return null;
  var end = new Date(next.getTime() + 60 * 60 * 1000);
  var discordUrl = 'https://discord.com/channels/' + window.PI_DISCORD_GUILD_ID + '/' + sig.channelId;
  var params = new URLSearchParams({
    action: 'TEMPLATE',
    text: sig.full + ' meeting',
    dates: window.PI_gcalStamp(next) + '/' + window.PI_gcalStamp(end),
    details: 'Protocol Institute SIG meeting. Join on Discord: ' + discordUrl,
    location: 'Discord — #' + sig.channelName
  });
  return 'https://calendar.google.com/calendar/render?' + params.toString();
};

// All-day (possibly multi-day) "add to calendar" link for an Institute event from data/events.json.
window.PI_eventGcalLink = function (ev) {
  var start = ev.date_start.replace(/-/g, '');
  var endDate = new Date(ev.date_end + 'T00:00:00Z');
  endDate.setUTCDate(endDate.getUTCDate() + 1); // Google's all-day end date is exclusive
  var end = endDate.getUTCFullYear() + pad2(endDate.getUTCMonth() + 1) + pad2(endDate.getUTCDate());
  var params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: start + '/' + end,
    details: ev.short_description || '',
    location: ev.location || ''
  });
  return 'https://calendar.google.com/calendar/render?' + params.toString();
};
