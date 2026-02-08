'use server'

import { getMaintenanceStatus, setMaintenanceStatus } from "@/lib/server/appwrite";
import { revalidatePath } from "next/cache";

export async function getMaintenanceState() {
  try {
    const status = await getMaintenanceStatus();
    return { success: true, enabled: status };
  } catch (error) {
    console.error("Failed to get maintenance status:", error);
    return { success: false, error: "Failed to fetch status" };
  }
}

export async function toggleMaintenance(enabled) {
  try {
    await setMaintenanceStatus(enabled);
    revalidatePath("/"); // Revalidate everything
    return { success: true, enabled };
  } catch (error) {
    console.error("Failed to toggle maintenance mode:", error);
    return { success: false, error: "Failed to update status" };
  }
}
