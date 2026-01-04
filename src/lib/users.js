import { databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

const DATABASE_ID = "valo-website-database";
const USERS_COLLECTION_ID = "users";

export async function saveUserProfile(userId, data) {
  try {
    // Try to update existing profile first
    return await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId,
      data
    );
  } catch (error) {
    if (error.code === 404) {
      // If not found, create new
      return await databases.createDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        userId,
        data
      );
    }
    throw error;
  }
}

export async function getUserProfile(userId) {
  try {
    return await databases.getDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId
    );
  } catch (error) {
    if (error.code === 404) return null;
    throw error;
  }
}
