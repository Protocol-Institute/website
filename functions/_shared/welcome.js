// Shared welcome email logic — imported by admin/members.js and membership/request.js

const WELCOME_PIN_TTL_MINUTES = 72 * 60;

function generatePin() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 1000000).padStart(6, '0');
}

async function hashPin(pin) {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(pin));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function sendWelcomeEmail(env, email, firstName) {
  const pin = generatePin();
  const pinHash = await hashPin(pin);
  const expiresAt = new Date(Date.now() + WELCOME_PIN_TTL_MINUTES * 60 * 1000).toISOString();

  await env.DB.prepare(
    'INSERT OR REPLACE INTO auth_pins (email, pin_hash, expires_at) VALUES (?, ?, ?)'
  ).bind(email, pinHash, expiresAt).run();

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Protocol Institute <noreply@protocol-institute.org>',
      to: [email],
      subject: 'Welcome to the Protocol Institute member network',
      html: `<p>Hi ${firstName},</p>
<p>Welcome! Your application to the Protocol Institute member network has been approved. You can now log in to view and update your profile.</p>
<p>Your sign-in code is: <strong style="font-size:1.4em;letter-spacing:0.1em">${pin}</strong></p>
<p>This code expires in 3 days. If it expires, you can always request a new one at <a href="https://protocol-institute.org/members/join">protocol-institute.org/members/join</a>.</p>
<p>You now have access to members-only features of the site, such as submitting <a href="https://protocol-institute.org/challenges">Challenges</a>. More features will be added in the future. If this email landed in spam, be sure to mark it not-spam.</p>
<p>— Protocol Institute</p>`,
    }),
  });

  if (!res.ok) {
    console.error('Resend error:', await res.text());
  }

  await env.DB.prepare(
    'UPDATE members SET welcome_sent = 1 WHERE email = ?'
  ).bind(email).run();
}
