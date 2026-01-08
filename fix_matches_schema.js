const { Client, Databases } = require('appwrite');
const fs = require('fs');

async function run() {
    let apiKey = '';
    try {
        const env = fs.readFileSync('.env', 'utf8');
        const match = env.match(/APPWRITE_API_KEY=(.*)/);
        if (match) apiKey = match[1].trim();
    } catch (e) {
        console.log("Could not read .env file");
    }

    const client = new Client()
        .setEndpoint('https://fra.cloud.appwrite.io/v1')
        .setProject('valo-website')
        .setKey(apiKey);

    const databases = new Databases(client);
    const dbId = 'valo-website-database';

    try {
        console.log("Checking attributes...");
        const response = await databases.listAttributes(dbId, 'matches');
        const keys = response.attributes.map(a => a.key);
        console.log("Existing attributes:", keys.join(', '));

        if (!keys.includes('scheduledTime')) {
            console.log("Adding scheduledTime...");
            await databases.createDatetimeAttribute(dbId, 'matches', 'scheduledTime', false);
            console.log("Added scheduledTime successfully.");
        }

        if (!keys.includes('vetoData')) {
            console.log("Adding vetoData...");
            await databases.createStringAttribute(dbId, 'matches', 'vetoData', 2000, false);
            console.log("Added vetoData successfully.");
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

run();
