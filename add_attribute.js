const { Client, Databases } = require('appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY); // Assuming API KEY is in .env for admin ops

const databases = new Databases(client);

async function addVetoData() {
    try {
        console.log("Adding vetoData attribute...");
        await databases.createStringAttribute(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            'matches',
            'vetoData',
            1000,
            false // not required
        );
        console.log("Successfully added vetoData column!");
    } catch (e) {
        console.error("Error:", e.message);
    }
}

addVetoData();
