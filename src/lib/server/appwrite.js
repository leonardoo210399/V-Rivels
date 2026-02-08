
import { Client, Databases, Storage, ID, Query } from "node-appwrite";

const client = new Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
  console.error("Appwrite server configuration missing!");
}

client
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);
const storage = new Storage(client);

// Constants for settings
const SETTINGS_COLLECTION_ID = "site_settings"; 
const GLOBAL_SETTINGS_DOC_ID = "global";

export async function getMaintenanceStatus() {
  try {
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    
    // Try to get the document directly
    const doc = await databases.getDocument(
      dbId,
      SETTINGS_COLLECTION_ID,
      GLOBAL_SETTINGS_DOC_ID
    );
    
    return doc.maintenanceMode || false;
  } catch (error) {
    // If collection or document doesn't exist, it means we are in normal mode
    // We could auto-create it here, but read operations should be fast.
    // Let the admin toggle logic handle creation on first use.
    return false;
  }
}

export async function setMaintenanceStatus(enabled) {
  const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

  try {
    // Try to update existing document
    await databases.updateDocument(
      dbId,
      SETTINGS_COLLECTION_ID,
      GLOBAL_SETTINGS_DOC_ID,
      { maintenanceMode: enabled }
    );
    return true;
  } catch (error) {
    // If it fails, maybe collection or document doesn't exist
    if (error.code === 404) {
      await ensureSettingsExist(dbId);
      // Retry update or create
      try {
         await databases.createDocument(
            dbId,
            SETTINGS_COLLECTION_ID,
            GLOBAL_SETTINGS_DOC_ID,
            { maintenanceMode: enabled }
         );
      } catch(e) {
         // If create fails (maybe partial existence), try update again
         await databases.updateDocument(
            dbId,
            SETTINGS_COLLECTION_ID,
            GLOBAL_SETTINGS_DOC_ID,
            { maintenanceMode: enabled }
         );
      }
      return true;
    }
    throw error;
  }
}

async function ensureSettingsExist(dbId) {
    try {
        await databases.getCollection(dbId, SETTINGS_COLLECTION_ID);
    } catch {
        await databases.createCollection(dbId, SETTINGS_COLLECTION_ID, "Site Settings");
        // Create attribute
        await databases.createBooleanAttribute(dbId, SETTINGS_COLLECTION_ID, "maintenanceMode", false, false);
        // Wait a bit for attribute to be available
        await new Promise(r => setTimeout(r, 2000));
    }
}

export { client, databases, storage, SETTINGS_COLLECTION_ID, GLOBAL_SETTINGS_DOC_ID };
