/**
 * Test Domain Availability Filtering
 * Verifies that only available domains are returned
 */

import { checkBatchAvailability, DomainAvailability } from './server/services/domainAvailability.js';

// Test domains - mix of definitely taken and potentially available
const testDomains = [
  'google.com',           // Definitely taken
  'facebook.com',         // Definitely taken
  'amazon.com',           // Definitely taken
  'this-is-a-test-domain-12345-xyz.com',  // Likely available
  'mytestdomain-98765-abc.net',           // Likely available
  'randomtest-domain-55555.org',          // Likely available
  'stripe.com',           // Definitely taken
  'vercel.com',           // Definitely taken
];

async function testDomainAvailability() {
  console.log('='.repeat(60));
  console.log('🧪 Testing Domain Availability Checker');
  console.log('='.repeat(60));
  console.log();

  console.log('Testing domains:', testDomains.join(', '));
  console.log();

  try {
    // Check without API credentials (uses DNS fallback)
    console.log('Checking availability (DNS fallback mode)...');
    const results = await checkBatchAvailability(testDomains);

    console.log();
    console.log('='.repeat(60));
    console.log('📊 RESULTS');
    console.log('='.repeat(60));
    console.log();

    const available: DomainAvailability[] = [];
    const taken: DomainAvailability[] = [];
    const unknown: DomainAvailability[] = [];

    results.forEach(result => {
      if (result.available === true) {
        available.push(result);
      } else if (result.available === false) {
        taken.push(result);
      } else {
        unknown.push(result);
      }
    });

    console.log(`✅ AVAILABLE (${available.length}):`);
    available.forEach(r => {
      console.log(`   • ${r.domain}`);
      console.log(`     Status: ${r.status}`);
      if (r.pricing) {
        console.log(`     Price: $${r.pricing[0]?.price} ${r.pricing[0]?.currency}`);
      }
      console.log();
    });

    console.log(`❌ TAKEN/REGISTERED (${taken.length}):`);
    taken.forEach(r => {
      console.log(`   • ${r.domain}`);
      console.log(`     Status: ${r.status}`);
      console.log();
    });

    if (unknown.length > 0) {
      console.log(`⚠️  UNKNOWN (${unknown.length}):`);
      unknown.forEach(r => {
        console.log(`   • ${r.domain}`);
        console.log(`     Status: ${r.status}`);
        console.log(`     Error: ${r.error}`);
        console.log();
      });
    }

    console.log('='.repeat(60));
    console.log('📈 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total checked: ${results.length}`);
    console.log(`Available: ${available.length}`);
    console.log(`Taken: ${taken.length}`);
    console.log(`Unknown: ${unknown.length}`);
    console.log();

    // Verify logic
    console.log('='.repeat(60));
    console.log('✅ VERIFICATION');
    console.log('='.repeat(60));

    const googleResult = results.find(r => r.domain === 'google.com');
    const facebookResult = results.find(r => r.domain === 'facebook.com');
    const testResult = results.find(r => r.domain.includes('this-is-a-test'));

    if (googleResult && !googleResult.available) {
      console.log('✅ google.com correctly marked as TAKEN');
    } else {
      console.log('❌ google.com should be TAKEN but was marked available!');
    }

    if (facebookResult && !facebookResult.available) {
      console.log('✅ facebook.com correctly marked as TAKEN');
    } else {
      console.log('❌ facebook.com should be TAKEN but was marked available!');
    }

    if (testResult && testResult.available) {
      console.log('✅ Test domain correctly marked as AVAILABLE');
    } else if (testResult) {
      console.log(`⚠️  Test domain marked as: ${testResult.status}`);
      console.log('   (May be taken or DNS check inconclusive)');
    }

    console.log();
    console.log('='.repeat(60));
    console.log('🎯 FILTERING TEST');
    console.log('='.repeat(60));

    // Simulate what the domain checker router does - filter for available only
    const availableOnly = results.filter(r => r.available === true);
    console.log(`Available domains only: ${availableOnly.length}`);
    console.log('Domains:');
    availableOnly.forEach(r => console.log(`   • ${r.domain}`));

    console.log();
    console.log('✅ Test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDomainAvailability();
