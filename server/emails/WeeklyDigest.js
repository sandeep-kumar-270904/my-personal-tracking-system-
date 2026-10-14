/**
 * Generates an accessible, responsive HTML email string for the weekly digest.
 * Pure Node.js function with zero React or Babel dependencies.
 */
function generateWeeklyDigestHtml({
  firstName = 'Scholar',
  resourcesCompleted = 0,
  currentStreak = 0,
  upvotesGiven = 0,
  reviewsWritten = 0,
  newBadges = [],
  categoryProgress = [],
  topResource = null,
  recommendedResource = null,
  streakMessage = 'Keep up the consistent momentum!'
}) {
  const categoryHtml = (categoryProgress && categoryProgress.length > 0)
    ? categoryProgress.map(cat => `
        <p style="font-size: 14px; line-height: 20px; color: #52525b; margin: 8px 0;">
          <strong>${cat.category}:</strong> ${cat.completed} of ${cat.total} resources completed (${cat.percentage}%)
        </p>
      `).join('')
    : '<p style="font-size: 14px; color: #71717a;">No category activity logged this week.</p>';

  const topResourceHtml = topResource ? `
    <h2 style="font-size: 18px; font-weight: bold; color: #27272a; margin-top: 32px;">Top Resource This Week</h2>
    <p style="font-size: 16px; line-height: 24px; color: #52525b;">
      <strong>${topResource.title}</strong><br/>
      <span style="font-size: 14px; color: #71717a;">${topResource.category} • ${topResource.difficulty} • ${topResource.upvotes || 0} Upvotes</span>
    </p>
    <a href="${topResource.url || 'https://my-personal-tracking-system-jrnr.vercel.app/prephub'}" style="background-color: #6366f1; border-radius: 4px; color: #fff; font-size: 14px; text-decoration: none; text-align: center; display: inline-block; padding: 12px 24px; margin-top: 8px;">
      Check It Out →
    </a>
    <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
  ` : '';

  const recommendedHtml = recommendedResource ? `
    <h2 style="font-size: 18px; font-weight: bold; color: #27272a; margin-top: 32px;">Your Next Recommended Resource</h2>
    <p style="font-size: 16px; line-height: 24px; color: #52525b;">
      <strong>${recommendedResource.title}</strong>
    </p>
    <a href="${recommendedResource.url || 'https://my-personal-tracking-system-jrnr.vercel.app/prephub'}" style="background-color: #27272a; border-radius: 4px; color: #fff; font-size: 14px; text-decoration: none; text-align: center; display: inline-block; padding: 12px 24px; margin-top: 8px;">
      Start This →
    </a>
    <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
  ` : '';

  const badgesHtml = (newBadges && newBadges.length > 0)
    ? `• New badges earned this week: <strong>${newBadges.join(', ')}</strong><br/>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your PrepHub Week in Review</title>
</head>
<body style="background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; margin: 0; padding: 20px 0;">
  <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 8px; border: 1px solid #e2e8f0;">
    <h1 style="font-size: 22px; letter-spacing: -0.5px; line-height: 1.3; font-weight: 600; color: #1e293b; margin-top: 0;">
      Hey ${firstName}, here's your PrepHub summary for the week.
    </h1>
    
    <h2 style="font-size: 18px; font-weight: bold; color: #27272a; margin-top: 32px;">
      Your Week at a Glance
    </h2>
    <p style="font-size: 16px; line-height: 24px; color: #52525b;">
      • Resources completed this week: <strong>${resourcesCompleted}</strong><br/>
      • Current streak: <strong>${currentStreak} days 🔥</strong><br/>
      • Upvotes given: <strong>${upvotesGiven}</strong><br/>
      • Reviews written: <strong>${reviewsWritten}</strong><br/>
      ${badgesHtml}
    </p>

    <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 24px 0;" />

    <h2 style="font-size: 18px; font-weight: bold; color: #27272a;">
      Your Progress by Category
    </h2>
    ${categoryHtml}

    <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 24px 0;" />

    ${topResourceHtml}
    ${recommendedHtml}

    <h2 style="font-size: 18px; font-weight: bold; color: #27272a; margin-top: 32px;">
      Keep Going!
    </h2>
    <p style="font-size: 16px; line-height: 24px; color: #6366f1; font-weight: bold;">
      ${streakMessage}
    </p>

    <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 40px 0 20px;" />
    
    <p style="font-size: 12px; line-height: 16px; color: #a1a1aa; margin: 0;">
      You're receiving this because you're a StudentTracker user. Manage email preferences in your settings.
    </p>
  </div>
</body>
</html>`;
}

module.exports = generateWeeklyDigestHtml;
