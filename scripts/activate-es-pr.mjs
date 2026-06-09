#!/usr/bin/env node

import {
  createAdMeLocalizationGovernance,
  getPool,
  closePool,
} from '../src/lib/i18n/adapter.ts';

const adminActor = { id: 'es-pr-translation-operator', role: 'admin' };
const reviewerLinguistic = { id: 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e1', role: 'linguistic' }; // Sarah (Tech Dev)
const versionId = 'version-28aa73ae-fa4f-44b5-a9e3-8f5e5ff2b45b';

async function main() {
  console.log(`Starting review and activation flow for version ${versionId} in production...`);
  const pool = getPool();
  const gov = createAdMeLocalizationGovernance({
    tenantId: 'adme',
    client: pool,
    policy: {
      requiredReviews: ['linguistic'],
    },
  });

  try {
    // 1. Assign reviewer
    console.log(`Assigning Sarah (${reviewerLinguistic.id}) to es-PR as linguistic reviewer...`);
    try {
      await gov.assignReviewer({
        locale: 'es-PR',
        reviewerId: reviewerLinguistic.id,
        reviewerRole: 'linguistic',
        actor: adminActor,
      });
      console.log('Reviewer assigned successfully.');
    } catch (err) {
      if (err.code === 'review_conflict' || err.message.includes('already exists')) {
        console.log('Reviewer assignment already exists.');
      } else {
        throw err;
      }
    }

    // 2. Submit review decision
    console.log('Submitting review decision (approved) for catalog version...');
    await gov.submitReview({
      versionId,
      reviewerRole: 'linguistic',
      decision: 'approved',
      comment: 'Catalog validation passed, approved for Spanish (Puerto Rico).',
      actor: reviewerLinguistic,
    });
    console.log('Review decision submitted.');

    // 3. Approve catalog version
    console.log('Approving catalog version...');
    const approved = await gov.approveVersion({
      versionId,
      actor: adminActor,
    });
    console.log(`Catalog version state is now: ${approved.state}`);

    // 4. Activate catalog version
    console.log('Activating catalog version in production...');
    const active = await gov.activateVersion({
      versionId,
      actor: adminActor,
    });
    console.log(`Catalog version state is now: ${active.state}`);
    console.log('Spanish (Puerto Rico) catalog is now active in production!');
  } catch (error) {
    console.error('Failed to activate Spanish PR translation:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
