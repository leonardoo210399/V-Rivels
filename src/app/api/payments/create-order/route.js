import { NextResponse } from "next/server";
import { databases as adminDatabases } from "@/lib/server/appwrite";
import { ID, Query } from "node-appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const PAYMENT_REQUESTS_COLLECTION_ID = "payment_requests";

export async function POST(request) {
  try {
    const { amount, tournamentId, userId, teamName, customer_mobile, customer_email, metadata } = await request.json();

    const user_token = process.env.IMB_USER_TOKEN;
    const base_url = process.env.IMB_API_BASE_URL || "https://secure-stage.imb.org.in/";
    
    // 0. Check for existing pending request to prevent duplicates
    const existing = await adminDatabases.listDocuments(
        DATABASE_ID,
        PAYMENT_REQUESTS_COLLECTION_ID,
        [
            Query.equal("userId", userId),
            Query.equal("tournamentId", tournamentId),
            Query.equal("paymentStatus", "pending"),
            Query.orderDesc("$createdAt"),
            Query.limit(1)
        ]
    );

    let payReq;
    if (existing.total > 0) {
        payReq = existing.documents[0];
        console.log("Reusing existing pending payment request:", payReq.$id);
        
        // 0.1 Check if we already have links stored in metadata to avoid IMB 400 error
        try {
            const meta = JSON.parse(payReq.metadata || "{}");
            if (meta.payment_links) {
                console.log("Returning cached payment links for order:", payReq.$id);
                return NextResponse.json({
                    success: true,
                    ...meta.payment_links,
                    orderId: payReq.$id,
                });
            }
        } catch (e) {
            console.warn("Failed to parse metadata for existing request:", e);
        }
    } else {
        // 1. Create a Payment Request Document in Appwrite
        payReq = await adminDatabases.createDocument(
            DATABASE_ID,
            PAYMENT_REQUESTS_COLLECTION_ID,
            ID.unique(),
            {
                tournamentId,
                userId,
                teamName,
                metadata: JSON.stringify(metadata || {}),
                requestedAt: new Date().toISOString(),
                paymentStatus: "pending",
                amount: String(amount),
            }
        );
    }

    const order_id = payReq.$id;
    
    // 2. Call IMB API
    const endpoint = `${base_url.endsWith('/') ? base_url : base_url + '/'}api/create-order`;

    const formData = new URLSearchParams();
    formData.append("user_token", user_token);
    formData.append("amount", amount);
    formData.append("order_id", order_id);
    formData.append("customer_mobile", customer_mobile);
    formData.append("redirect_url", `${process.env.NEXT_PUBLIC_SITE_URL}/tournaments/${tournamentId}`);
    formData.append("remark1", customer_email); 
    formData.append("remark2", teamName || "Tournament Registration");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = await response.json();
    console.log("IMB Create Order Response:", JSON.stringify(data, null, 2));

    const isSuccess = data.status === true || String(data.status).toUpperCase() === "SUCCESS";

    if (isSuccess && data.result) {
      // 3. Store IMB's internal orderId and LINKS in our document
      try {
          const currentMeta = JSON.parse(payReq.metadata || "{}");
          const updatedMeta = {
              ...currentMeta,
              payment_links: {
                  payment_url: data.result.payment_url,
                  paytm_link: data.result.paytm_link,
                  bhim_link: data.result.bhim_link,
              }
          };

          await adminDatabases.updateDocument(
              DATABASE_ID,
              PAYMENT_REQUESTS_COLLECTION_ID,
              order_id,
              { 
                  imbOrderId: data.result.orderId,
                  metadata: JSON.stringify(updatedMeta)
              }
          );
      } catch (updateErr) {
          console.warn("Failed to store IMB order details/links:", updateErr);
      }

      return NextResponse.json({
        success: true,
        payment_url: data.result.payment_url,
        paytm_link: data.result.paytm_link,
        bhim_link: data.result.bhim_link,
        orderId: order_id, // Our document ID
      });
    } else {
      // Cleanup the pending request if IMB fails
      try {
          await adminDatabases.deleteDocument(DATABASE_ID, PAYMENT_REQUESTS_COLLECTION_ID, order_id);
      } catch (e) {}

      return NextResponse.json({
        success: false,
        message: data.message || "Failed to create IMB order",
        debug_status: data.status // Helpful for debugging
      }, { status: 400 });
    }
  } catch (error) {
    console.error("IMB Create Order Error:", error);
    return NextResponse.json({
      success: false,
      message: "Internal server error occurred",
    }, { status: 500 });
  }
}

