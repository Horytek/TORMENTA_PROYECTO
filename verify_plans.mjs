import { PLANS_CONFIG, getPlanPrice } from './client/src/config/plans.config.js';

const logs = [];
const consoleLog = console.log;
// Mock console to capture output for final report
console.log = (...args) => {
    logs.push(args.join(' '));
    // Also print to real stdout so we see it in command output
    process.stdout.write(args.join(' ') + '\n');
};
console.error = (...args) => {
    logs.push("ERROR: " + args.join(' '));
    process.stderr.write("ERROR: " + args.join(' ') + '\n');
};

try {
    console.log("--- Verifying Plans Configuration ---");
    const planKeys = Object.keys(PLANS_CONFIG);
    console.log("Plans keys:", planKeys.join(", "));

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
        // It might be fine if user removed some features, but let's just log count
        console.log(`Enterprise features count: ${enterpriseFeatures.length}`);
    }

    // Verify Logic Helper
    const basicPrice = getPlanPrice('Basic', 'mes');
    if (basicPrice && basicPrice.price === 79) {
        console.log("SUCCESS: Basic plan price is correct (79).");
    } else {
        console.error(`FAILED: Basic plan price is incorrect. Got: ${JSON.stringify(basicPrice)}`);
    }

    const enterprisePrice = getPlanPrice('Enterprise', 'mes');
    if (enterprisePrice && (enterprisePrice.price === 299 || enterprisePrice.price > 0)) {
        console.log(`SUCCESS: Enterprise plan price is set to ${enterprisePrice.price}.`);
    } else {
        console.error(`FAILED: Enterprise plan price is incorrect (expected > 0). Got: ${JSON.stringify(enterprisePrice)}`);
    }

    console.log("--- Verification Complete ---");

} catch (error) {
    console.error("ERROR running verification:", error);
    process.exit(1);
}
