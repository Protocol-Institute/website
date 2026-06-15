// Shared welcome email logic — imported by admin/members.js and membership/request.js

export async function sendWelcomeEmail(env, email, firstName) {
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
<p>Your application to the Protocol Institute member network has been approved. You can now log in to view and update your profile, and access members-only features of the site.</p>
<p>To log in, visit <a href="https://protocol-institute.org/members/join">protocol-institute.org/members/join</a>, enter your email address, and request a sign-in code.</p>
<p>You'll be able to edit your profile and access members-only features of the site.</p>
<p>If this email landed in spam, mark it not-spam and add noreply@protocol-institute.org to your contacts so future emails reach you.</p>
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
