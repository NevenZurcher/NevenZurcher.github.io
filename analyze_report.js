const fs = require('fs');
const path = require('path');

const reportPath = path.resolve('../localhost_5173-20260128T154900.json');

try {
    const data = fs.readFileSync(reportPath, 'utf8');
    const report = JSON.parse(data);

    console.log('--- Lighthouse Scores ---');
    Object.keys(report.categories).forEach(cat => {
        console.log(`${report.categories[cat].title}: ${report.categories[cat].score * 100}`);
    });

    console.log('\n--- Failed Audits (Score < 1) ---');
    Object.values(report.audits).forEach(audit => {
        if (audit.score !== null && audit.score < 1 && audit.score !== 0.99) { // Filter out near-perfect
            console.log(`\nAudit: ${audit.title} (${audit.id})`);
            console.log(`Score: ${audit.score}`);
            console.log(`Value: ${audit.displayValue}`);
            if (audit.details && audit.details.items && audit.details.items.length > 0) {
                console.log('Details (First 3 items):');
                console.log(JSON.stringify(audit.details.items.slice(0, 3), null, 2));
            }
        }
    });

} catch (err) {
    console.error('Error reading/parsing report:', err);
}
