import { Response } from "express";
import { AuthRequest } from "../../types";
import { Notification } from "../../models/Notification";
import { NotificationTemplate } from "../../models/NotificationTemplate";
import { NotificationLog } from "../../models/NotificationLog";
import { Person } from "../../models/Person";
import { notificationQueue } from "../../queue/notification.queue";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";

export async function listMyNotifications(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = parseInt(req.query.pageSize as string ?? "20");
  const unreadOnly = req.query.unread === "true";

  const filter: Record<string, unknown> = { recipientId: req.user!.id };
  if (unreadOnly) filter.readAt = null;

  const [data, total] = await Promise.all([
    Notification.find(filter).sort("-createdAt").skip((page - 1) * pageSize).limit(pageSize),
    Notification.countDocuments(filter),
  ]);
  return sendPaginated(res, data, total, page, pageSize);
}

export async function markRead(req: AuthRequest, res: Response) {
  await Notification.updateMany(
    { recipientId: req.user!.id, readAt: null },
    { readAt: new Date() },
  );
  return sendSuccess(res, null, "All notifications marked as read");
}

export async function listTemplates(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.tenantId;
  const templates = await NotificationTemplate.find({ tenantId }).lean();
  return sendSuccess(res, templates);
}

export async function createTemplate(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.tenantId;
  const { channel, triggerType, subject, bodyTemplate } = req.body;

  const existing = await NotificationTemplate.findOne({ tenantId, triggerType, channel });
  if (existing) {
    return sendError(res, 400, "A template for this trigger and channel already exists.");
  }

  const template = await NotificationTemplate.create({
    tenantId,
    channel,
    triggerType,
    subject,
    bodyTemplate
  });

  return sendSuccess(res, template, "Template created", 201);
}

export async function updateTemplate(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.tenantId;
  const template = await NotificationTemplate.findOneAndUpdate(
    { _id: req.params.id, tenantId },
    { $set: req.body },
    { new: true }
  );

  if (!template) return sendError(res, 404, "Template not found");
  return sendSuccess(res, template, "Template updated");
}

export async function listLogs(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.tenantId;
  const logs = await NotificationLog.find({ tenantId })
    .populate("personId", "fullName email phone")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return sendSuccess(res, logs);
}

export async function sendPromo(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.tenantId;
  const { audience, messageBody, channel } = req.body; 
  
  if (!messageBody || !channel) {
    return sendError(res, 400, "Message body and channel are required");
  }

  const filter: any = { tenantId };
  if (audience === "all_clients") filter.isClient = true;
  else if (audience === "all_students") filter.isStudent = true;
  else return sendError(res, 400, "Invalid audience selection");

  const people = await Person.find(filter).lean();
  if (people.length === 0) {
    return sendError(res, 400, "No recipients found for this audience");
  }

  await NotificationTemplate.findOneAndUpdate(
    { tenantId, triggerType: "promo", channel },
    { $set: { bodyTemplate: messageBody, subject: "Promo" } },
    { upsert: true }
  );

  for (const person of people) {
    const contact = channel === "email" ? person.email : person.phone;
    if (contact) {
      notificationQueue.add({
        tenantId,
        triggerType: "promo",
        overrideChannel: channel,
        personId: person._id,
        recipientContact: contact,
        variables: {
          clientName: person.fullName
        }
      });
    }
  }

  return sendSuccess(res, { count: people.length }, `Queued ${people.length} promotional messages`);
}
