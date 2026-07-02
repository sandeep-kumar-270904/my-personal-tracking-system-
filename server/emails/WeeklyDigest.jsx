import React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Heading,
  Hr,
} from '@react-email/components';

const WeeklyDigest = ({
  firstName,
  resourcesCompleted,
  currentStreak,
  upvotesGiven,
  reviewsWritten,
  newBadges,
  categoryProgress, // [{ category, completed, total, percentage }]
  topResource,      // { title, category, difficulty, upvotes, url }
  recommendedResource, // { title, url }
  streakMessage,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Your PrepHub Week in Review 📚 — {resourcesCompleted} resources completed</Preview>
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px' }}>
          <Section style={{ padding: '0 48px' }}>
            <Heading style={{ fontSize: '24px', letterSpacing: '-0.5px', lineHeight: '1.3', fontWeight: '400', color: '#484848', padding: '17px 0 0' }}>
              Hey {firstName}, here's your PrepHub summary for the week.
            </Heading>
            
            <Heading as="h2" style={{ fontSize: '18px', fontWeight: 'bold', color: '#27272a', marginTop: '32px' }}>
              Your Week at a Glance
            </Heading>
            <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#52525b' }}>
              • Resources completed this week: <strong>{resourcesCompleted}</strong><br/>
              • Current streak: <strong>{currentStreak} days 🔥</strong><br/>
              • Upvotes given: <strong>{upvotesGiven}</strong><br/>
              • Reviews written: <strong>{reviewsWritten}</strong><br/>
              {newBadges && newBadges.length > 0 && (
                <>• New badges earned this week: <strong>{newBadges.join(', ')}</strong><br/></>
              )}
            </Text>

            <Hr style={{ borderColor: '#e4e4e7', margin: '20px 0' }} />

            <Heading as="h2" style={{ fontSize: '18px', fontWeight: 'bold', color: '#27272a' }}>
              Your Progress by Category
            </Heading>
            {categoryProgress && categoryProgress.map(cat => (
              <Text key={cat.category} style={{ fontSize: '14px', lineHeight: '20px', color: '#52525b', margin: '8px 0' }}>
                <strong>{cat.category}:</strong> {cat.completed} of {cat.total} resources completed ({cat.percentage}%)
              </Text>
            ))}

            <Hr style={{ borderColor: '#e4e4e7', margin: '20px 0' }} />

            {topResource && (
              <>
                <Heading as="h2" style={{ fontSize: '18px', fontWeight: 'bold', color: '#27272a' }}>
                  Top Resource This Week
                </Heading>
                <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#52525b' }}>
                  <strong>{topResource.title}</strong><br/>
                  <span style={{ fontSize: '14px', color: '#71717a' }}>{topResource.category} • {topResource.difficulty} • {topResource.upvotes} Upvotes</span>
                </Text>
                <Button href={topResource.url || "https://your-domain.com/prephub"} style={{ backgroundColor: '#6366f1', borderRadius: '4px', color: '#fff', fontSize: '14px', textDecoration: 'none', textAlign: 'center', display: 'block', width: '200px', padding: '12px' }}>
                  Check It Out →
                </Button>
                <Hr style={{ borderColor: '#e4e4e7', margin: '20px 0' }} />
              </>
            )}

            {recommendedResource && (
              <>
                <Heading as="h2" style={{ fontSize: '18px', fontWeight: 'bold', color: '#27272a' }}>
                  Your Next Recommended Resource
                </Heading>
                <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#52525b' }}>
                  <strong>{recommendedResource.title}</strong>
                </Text>
                <Button href={recommendedResource.url || "https://your-domain.com/prephub"} style={{ backgroundColor: '#27272a', borderRadius: '4px', color: '#fff', fontSize: '14px', textDecoration: 'none', textAlign: 'center', display: 'block', width: '200px', padding: '12px' }}>
                  Start This →
                </Button>
                <Hr style={{ borderColor: '#e4e4e7', margin: '20px 0' }} />
              </>
            )}

            <Heading as="h2" style={{ fontSize: '18px', fontWeight: 'bold', color: '#27272a' }}>
              Keep Going!
            </Heading>
            <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#6366f1', fontWeight: 'bold' }}>
              {streakMessage}
            </Text>

            <Hr style={{ borderColor: '#e4e4e7', margin: '40px 0 20px' }} />
            
            <Text style={{ fontSize: '12px', lineHeight: '16px', color: '#a1a1aa' }}>
              You're receiving this because you're a StudentTracker user. Manage email preferences in your settings.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WeeklyDigest;
