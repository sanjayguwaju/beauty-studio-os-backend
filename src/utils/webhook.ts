import axios from "axios";
import crypto from "crypto";
import { WebhookConfig } from "../models/WebhookConfig";
import { WebhookEventLog } from "../models/WebhookEventLog";

export async function dispatchWebhookEvent(tenantId: string, eventName: string, payload: any) {
  try {
    // 1. Find active webhooks for this tenant that subscribe to this event
    const configs = await WebhookConfig.find({
      tenantId,
      isActive: true,
      events: eventName
    });

    if (configs.length === 0) return;

    // 2. Dispatch to each config
    for (const config of configs) {
      const payloadString = JSON.stringify(payload);
      
      // Calculate HMAC signature
      const signature = crypto
        .createHmac("sha256", config.secret)
        .update(payloadString)
        .digest("hex");

      let status: "success" | "failed" = "failed";
      let statusCode = 500;
      let errorMessage = "";

      try {
        const response = await axios.post(config.url, payload, {
          headers: {
            "Content-Type": "application/json",
            "x-studioos-signature": signature,
            "x-studioos-event": eventName
          },
          timeout: 5000 // 5 second timeout
        });
        
        status = "success";
        statusCode = response.status;
      } catch (err: any) {
        status = "failed";
        statusCode = err.response?.status || 500;
        errorMessage = err.message;
      }

      // 3. Log the outcome
      await WebhookEventLog.create({
        tenantId,
        webhookConfigId: config._id,
        event: eventName,
        payload,
        status,
        responseStatusCode: statusCode,
        errorMessage: status === "failed" ? errorMessage : undefined
      });
    }
  } catch (error) {
    console.error(`Failed to dispatch webhook event ${eventName} for tenant ${tenantId}`, error);
  }
}
