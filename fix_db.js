const { Client, Databases } = require('appwrite');
const fs = require('fs');

async function run() {
    console.log("Starting DB Fix Script...");
    
    let env = {};
    try {
        const data = fs.readFileSync('.env', 'utf8');
        data.split('\n').forEach(line => {
            const [key, ...val] = line.split('=');
            if (key && val) env[key.trim()] = val.join('=').trim();
        });
        console.log("Loaded .env file.");
    } catch (e) {
        console.log("No .env file found or readable.");
    }

    const endpoint = env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
    const project = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'valo-website';
    const key = env.APPWRITE_API_KEY;
    const dbId = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'valo-website-database';

    if (!key) {
        console.error("❌ ERROR: APPWRITE_API_KEY not found in .env. Please add it to perform schema updates.");
        return;
    }

    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(project)
        .setKey(key);

    const databases = new Databases(client);

    try {
        console.log(`Targeting Database: ${dbId}`);
        const response = await databases.listAttributes(dbId, 'matches');
        const keys = response.attributes.map(a => a.key);
        
        console.log("Existing attributes in 'matches':", keys.join(', '));

        if (!keys.includes('scheduledTime')) {
            console.log("Adding 'scheduledTime' (datetime)...");
            // Appwrite 1.4+ uses createDatetimeAttribute
            // If it's an older version, we might need createStringAttribute
            try {
                await databases.createDatetimeAttribute(dbId, 'matches', 'scheduledTime', false);
                console.log("✅ Added scheduledTime.");
            } catch (err) {
                console.log("Datetime attribute failed, trying String attribute as fallback...");
                await databases.createStringAttribute(dbId, 'matches', 'scheduledTime', 100, false);
                console.log("✅ Added scheduledTime as String.");
            }
        } else {
            console.log("✅ 'scheduledTime' already exists.");
        }

        if (!keys.includes('vetoData')) {
            console.log("Adding 'vetoData' (string)...");
            await databases.createStringAttribute(dbId, 'matches', 'vetoData', 2000, false);
            console.log("✅ Added vetoData.");
        } else {
            console.log("✅ 'vetoData' already exists.");
        }

    } catch (e) {
        console.error("❌ API ERROR:", e.message);
    }
}

run();
