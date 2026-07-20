import Queue from "bull";
import { env } from "../config/env";
import logger from "../config/logger";
import { NotificationTemplate } from "../models/NotificationTemplate";
import { NotificationLog } from "../models/NotificationLog";
import { getIO } from "../config/socket";

// Initialize Bull Queue
const redisUrl = env.REDIS_URL || `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`;
export const notificationQueue = new Queue("notifications", redisUrl);

// Worker Processor
notificationQueue.process(async (job) => {
  try {
    const { tenantId, triggerType, variables, personId, recipientContact, overrideChannel } = job.data;

    // Find the appropriate template
    const templateQuery: any = { tenantId, triggerType };
    if (overrideChannel) {
      templateQuery.channel = overrideChannel;
    }

    const template = await NotificationTemplate.findOne(templateQuery);

    if (!template) {
      logger.warn(`No notification template found for trigger: ${triggerType}`);
      return;
    }

    // Variable Substitution (Simple find and replace like {{clientName}})
    let renderedBody = template.bodyTemplate;
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, "g");
        renderedBody = renderedBody.replace(regex, String(value));
      }
    }

    // Mock Sender Logic
    logger.info(`[MOCK SENDER] Sending ${template.channel} to ${recipientContact}: ${renderedBody}`);

    // Log the notification
    const log = await NotificationLog.create({
      tenantId,
      personId,
      templateId: template._id,
      channel: template.channel,
      status: "sent",
      recipientContact,
      sentContent: renderedBody,
      sentAt: new Date()
    });

    // Optionally emit a socket event to update the UI instantly if the admin is watching logs
    getIO().to(`tenant:${tenantId}`).emit("notification_sent", log);

    return log;
  } catch (error) {
    logger.error("Error processing notification job", error);
    throw error;
  }
});

notificationQueue.on("failed", (job, err) => {
  logger.error(`Notification Job ${job.id} failed`, err);
  // We could update NotificationLog to 'failed' here if we had created a 'queued' row first, 
  // but for MVP we are just logging the successful ones immediately upon processing.
});
