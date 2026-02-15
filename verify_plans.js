import { PLANS_CONFIG, getPlanPrice, isValidPlan } from './client/src/config/plans.config.js';

// Mock console.log to capture output
const logs = [];
const consoleLog = console.log;
console.log = (...args) => logs.push(args.join(' '));

try {
    console.log("--- Verifying Plans Configuration ---");
    console.log("Plans keys:", Object.keys(PLANS_CONFIG).join(", "));

    const expectedPlans = ['Basic', 'Pro', 'Enterprise', 'Diario', 'Semanal', 'Express'];
    const missingPlans = expectedPlans.filter(p => !PLANS_CONFIG[p]);

    if (missingPlans.length > 0) {
        console.error("FAILED: Missing plans:", missingPlans);
        process.exit(1);
    } else {
        console.log("SUCCESS: All expected plans are present.");
    }

    // Verify Enterprise Plan features
    const enterpriseFeatures = PLANS_CONFIG['Enterprise'].features;
    if (enterpriseFeatures && enterpriseFeatures.length > 4) {
        console.log("SUCCESS: Enterprise plan has extended features.");
    } else {
        console.error("WARNING: Enterprise features might be incomplete.");
    }

    // Verify Logic Helper
    if (getPlanPrice('Basic', 'mes').price === 79) {
        console.log("SUCCESS: Basic plan price is correct.");
    } else {
        console.error("FAILED: Basic plan price is incorrect.");
    }

    console.log("--- Verification Complete ---");

} catch (error) {
    console.error("ERROR running verification:", error);
    process.exit(1);
} finally {
    console.log = consoleLog;
    console.log(logs.join('\n'));
}
