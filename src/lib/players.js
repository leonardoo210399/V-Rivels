import { databases } from "./appwrite";
import { ID, Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const FREE_AGENTS_COLLECTION_ID = "free_agents"; // Ensure this matches your Appwrite Collection ID

export async function getFreeAgents() {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            FREE_AGENTS_COLLECTION_ID,
            [Query.orderDesc("createdAt"), Query.limit(50)]
        );
        return response.documents;
    } catch (error) {
        console.error("Failed to fetch free agents", error);
        return [];
    }
}

export async function createFreeAgentPost(data) {
    return await databases.createDocument(
        DATABASE_ID,
        FREE_AGENTS_COLLECTION_ID,
        ID.unique(),
        {
            userId: data.userId,
            ingameName: data.ingameName,
            tag: data.tag,
            role: data.role,
            region: data.region || "ap",
            description: data.description,
            mainAgent: data.mainAgent,
            secondaryAgents: data.secondaryAgents || [],
            createdAt: new Date().toISOString()
        }
    );
}

export async function deleteFreeAgentPost(documentId) {
    return await databases.deleteDocument(
        DATABASE_ID,
        FREE_AGENTS_COLLECTION_ID,
        documentId
    );
}

export async function updateFreeAgentPost(documentId, data) {
    return await databases.updateDocument(
        DATABASE_ID,
        FREE_AGENTS_COLLECTION_ID,
        documentId,
        data
    );
}

export async function getUserFreeAgentPost(userId) {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            FREE_AGENTS_COLLECTION_ID,
            [Query.equal("userId", userId), Query.limit(1)]
        );
        return response.documents[0] || null;
    } catch (error) {
        console.error("Failed to fetch user free agent post", error);
        return null;
    }
}
