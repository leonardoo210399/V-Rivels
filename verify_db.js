const { Client, Databases } = require('appwrite');
// We won't use .env since I can't be sure API_KEY is set there, but I'll try to use the project ID and endpoint
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1') // Default, adjust if needed
    .setProject('valo-website'); // From earlier logs

const databases = new Databases(client);

async function checkAttributes() {
    try {
        console.log("Fetching attributes for 'matches' collection...");
        // Using common IDs found previously
        const response = await databases.listAttributes(
            'valo-website-database',
            'matches'
        );
        const hasVetoData = response.attributes.some(attr => attr.key === 'vetoData');
        console.log("Attributes found:", response.attributes.map(a => a.key).join(', '));
        if (hasVetoData) {
            console.log("✅ SUCCESS: 'vetoData' attribute is present!");
        } else {
            console.log("❌ MISSING: 'vetoData' attribute not found.");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkAttributes();
