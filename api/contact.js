const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, company, budget, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    await resend.emails.send({
      from: 'POLYFLOW <clients.polyflow@gmail.com>', // Switch to verified domain before going live
      to: [process.env.CONTACT_EMAIL],
      replyTo: email,
      subject: `[ BLUEPRINT REQUEST ] — ${name}${company ? ` / ${company}` : ''}`,
      html: `
        <div style="font-family:monospace;background:#0A0A0A;color:#E8E4E0;padding:32px;max-width:600px;">
          <p style="font-size:11px;letter-spacing:0.2em;color:#666;text-transform:uppercase;margin-bottom:24px;">POLYFLOW — BLUEPRINT REQUEST</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #222;color:#666;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;width:100px;">NAME</td>
              <td style="padding:12px 0;border-bottom:1px solid #222;color:#E8E4E0;">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #222;color:#666;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">EMAIL</td>
              <td style="padding:12px 0;border-bottom:1px solid #222;color:#E8E4E0;">${escapeHtml(email)}</td>
            </tr>
            ${company ? `
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #222;color:#666;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">COMPANY</td>
              <td style="padding:12px 0;border-bottom:1px solid #222;color:#E8E4E0;">${escapeHtml(company)}</td>
            </tr>` : ''}
            ${budget ? `
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #222;color:#666;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">BUDGET</td>
              <td style="padding:12px 0;border-bottom:1px solid #222;color:#E8E4E0;">${escapeHtml(budget)}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:16px 0;color:#666;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;vertical-align:top;">MESSAGE</td>
              <td style="padding:16px 0;color:#E8E4E0;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</td>
            </tr>
          </table>
        </div>
      `,
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Email delivery failed' });
  }
};
