#!/usr/bin/env node

import {
  createAdMeLocalizationGovernance,
  getPool,
  closePool,
} from '../src/lib/i18n/adapter.ts';
import fs from 'node:fs';

const canonicalCatalog = JSON.parse(
  fs.readFileSync(new URL('../src/lib/i18n/catalog.en-US.json', import.meta.url), 'utf8')
);

const ES_PR_MESSAGES = {
  app_name: 'AdMe',
  welcome_message: '¡Bienvenido de nuevo, {name}!',
  points_balance: 'Tienes {points} puntos de recompensa.',
  scratch_card_title: 'Jugar tarjeta de raspar',
  redeem_points: 'Canjear puntos',
  privacy_shield_enabled: 'El escudo de privacidad está activado',
  ad_credits: 'Créditos: {credits}',
  campaign_status: 'Estado de campaña: {status}',
  likes_count_one: '1 amor',
  likes_count_other: '{count} amores',
};

const adminActor = { id: 'es-pr-translation-operator', role: 'admin' };

async function main() {
  console.log('Starting Spanish (Puerto Rico) catalog creation...');
  const pool = getPool();
  const gov = createAdMeLocalizationGovernance({
    tenantId: 'adme',
    client: pool,
    policy: {
      requiredReviews: ['linguistic'],
    },
  });

  try {
    // 1. Ensure source locale en-US and its active catalog exist
    console.log("Checking if source locale 'en-US' exists...");
    try {
      await gov.getStatus('en-US');
      console.log("Source locale 'en-US' already exists.");
    } catch {
      console.log("Source locale 'en-US' not found. Creating 'en-US'...");
      await gov.createLocale({
        code: 'en-US',
        sourceLocale: 'en-US',
        actor: adminActor,
      });
      console.log("Source locale 'en-US' created. Seeding active catalog...");
      await gov.createCatalogVersion({
        locale: 'en-US',
        messages: canonicalCatalog,
        actor: adminActor,
        source: true,
      });
      console.log("Source catalog 'en-US' version created and active.");
    }

    // 2. Create es-PR locale if not exists
    console.log("Checking if locale 'es-PR' exists...");
    try {
      await gov.getStatus('es-PR');
      console.log("Locale 'es-PR' already exists.");
    } catch {
      console.log("Locale 'es-PR' not found. Creating locale...");
      await gov.createLocale({
        code: 'es-PR',
        sourceLocale: 'en-US',
        actor: adminActor,
      });
      console.log("Locale 'es-PR' created successfully.");
    }

    // 3. Create the catalog version containing the Spanish translations
    console.log('Creating catalog version draft for es-PR...');
    const version = await gov.createCatalogVersion({
      locale: 'es-PR',
      messages: ES_PR_MESSAGES,
      actor: adminActor,
      provenance: {
        provider: 'machine_translation',
        seedLocale: 'es-MX',
        regionalVariant: 'es-PR',
        humanReviewedCount: 0,
      },
    });
    console.log(`Catalog version version_number=${version.version} created (id: ${version.id}).`);

    // 4. Run validation checks
    console.log('Running validation checks on the catalog version...');
    const validation = await gov.validateVersion({
      versionId: version.id,
      actor: adminActor,
      untranslatedAllowlist: ['app_name'],
    });
    console.log(`Validation result: passed=${validation.report.passed}, coverage=${validation.report.coverage}%`);

    // 5. Request review (validated -> in_linguistic_review)
    console.log('Requesting linguistic review for the catalog version...');
    const reviewVersion = await gov.requestReview({
      versionId: version.id,
      actor: adminActor,
    });
    console.log(`Catalog version is now in review status: ${reviewVersion.state}`);

    console.log('\nSummary:');
    console.log(
      JSON.stringify(
        {
          locale: 'es-PR',
          versionId: version.id,
          state: reviewVersion.state,
          validationPassed: validation.report.passed,
          coverage: validation.report.coverage,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error('Failed to create Spanish PR translation:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
