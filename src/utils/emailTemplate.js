const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const withLineBreaks = (value = '') => escapeHtml(value).replace(/\n/g, '<br/>');

const stripHtml = (value = '') => String(value).replace(/<[^>]+>/g, ' ');

const buildNewsletterEmail = ({
  title,
  greeting = 'Hello,',
  intro,
  body,
  ctaText,
  ctaUrl,
  fallbackUrl,
  footerText,
  logoUrl,
  companyName = 'BSFYE',
  year = new Date().getFullYear(),
}) => {
  const safeTitle = escapeHtml(title || 'Notification');
  const safeGreeting = escapeHtml(greeting);
  const safeIntro = withLineBreaks(intro || '');
  const safeBody = withLineBreaks(body || '');
  const safeCtaText = escapeHtml(ctaText || 'Open');
  const safeCtaUrl = ctaUrl ? escapeHtml(ctaUrl) : '';
  const safeFallbackUrl = fallbackUrl ? escapeHtml(fallbackUrl) : '';
  const safeFooterText = escapeHtml(footerText || `© ${year} ${companyName}. All Rights Reserved.`);
  const safeLogoUrl = escapeHtml(
    logoUrl || process.env.EMAIL_LOGO_URL || 'https://yourwebsite.com/logo.png'
  );

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f4;padding:40px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
<tr>
<td align="center" style="background:#ffffff;padding:25px;border-bottom:1px solid #e5e7eb;">
<img src="${safeLogoUrl}" alt="Company Logo" width="170" style="display:block;border:0;outline:none;text-decoration:none;">
</td>
</tr>
<tr>
<td style="padding:40px;">
<h2 style="margin:0 0 20px;color:#222222;font-size:28px;font-weight:bold;">${safeTitle}</h2>
<p style="margin:0 0 20px;color:#555555;font-size:16px;line-height:26px;">${safeGreeting}</p>
${safeIntro ? `<p style="margin:0 0 20px;color:#555555;font-size:16px;line-height:26px;">${safeIntro}</p>` : ''}
${safeBody ? `<p style="margin:0 0 20px;color:#555555;font-size:16px;line-height:26px;">${safeBody}</p>` : ''}
${safeCtaUrl ? `<table role="presentation" align="center" cellspacing="0" cellpadding="0" style="margin:35px auto;"><tr><td align="center" style="background:#2563eb;border-radius:5px;"><a href="${safeCtaUrl}" style="display:inline-block;padding:15px 35px;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;">${safeCtaText}</a></td></tr></table>` : ''}
${safeFallbackUrl ? `<p style="margin:25px 0 10px;color:#555555;font-size:15px;line-height:24px;">If the button doesn't work, copy and paste this link into your browser:</p><p style="margin:0;color:#2563eb;font-size:14px;word-break:break-all;">${safeFallbackUrl}</p>` : ''}
</td>
</tr>
<tr>
<td align="center" style="background:#fafafa;border-top:1px solid #e5e7eb;padding:20px;color:#888888;font-size:13px;">
${safeFooterText}
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>
`;

  const textParts = [title, greeting, intro, body];
  if (ctaUrl) textParts.push(`Action Link: ${ctaUrl}`);
  if (fallbackUrl) textParts.push(`Fallback Link: ${fallbackUrl}`);
  const text = textParts
    .filter(Boolean)
    .map((part) => stripHtml(part))
    .join('\n\n');

  return { html, text };
};

module.exports = {
  buildNewsletterEmail,
};
