import { Response } from "express";
import { AuthRequest } from "../../types";
import { AttendanceRecord } from "../../models/AttendanceRecord";
import { sendSuccess, sendError } from "../../utils/response";
import { Batch } from "../../models/Batch";

export async function getAttendanceForBatch(req: AuthRequest, res: Response) {
  const { batchId } = req.params;
  const { sessionDate } = req.query; // YYYY-MM-DD

  const tenantId = req.user!.tenantId || req.user!.tenantId;

  const batch = await Batch.findOne({ _id: batchId, tenantId });
  if (!batch) return sendError(res, 404, "Batch not found");

  const filter: Record<string, unknown> = { batchId, tenantId };
  if (sessionDate) {
    filter.sessionDate = sessionDate;
  }

  const records = await AttendanceRecord.find(filter)
    .populate("studentPersonId", "fullName email")
    .lean();

  return sendSuccess(res, records);
}

export async function syncAttendance(req: AuthRequest, res: Response) {
  if (req.ability!.cannot("update", "Batch")) {
    return sendError(res, 403, "Forbidden");
  }

  const tenantId = req.user!.tenantId || req.user!.tenantId;
  const { records } = req.body; // Array of { batchId, studentPersonId, sessionDate, status, recordedOffline, syncedAt }

  if (!Array.isArray(records)) {
    return sendError(res, 400, "Expected an array of attendance records");
  }

  const syncedResults = [];
  const errors = [];

  for (const record of records) {
    try {
      const { batchId, studentPersonId, sessionDate, status, recordedOffline, syncedAt } = record;

      // Ensure batch belongs to tenant
      const batch = await Batch.findOne({ _id: batchId, tenantId });
      if (!batch) {
        errors.push({ record, error: "Batch not found or unauthorized" });
        continue;
      }

      // We perform an upsert based on batchId, studentPersonId, and sessionDate
      const existing = await AttendanceRecord.findOne({ batchId, studentPersonId, sessionDate });

      if (existing) {
        // Simple conflict resolution: Only update if the incoming syncedAt is newer
        const incomingDate = new Date(syncedAt);
        if (incomingDate > existing.syncedAt) {
          existing.status = status;
          existing.recordedOffline = recordedOffline || false;
          existing.syncedAt = incomingDate;
          await existing.save();
        }
        syncedResults.push(existing);
      } else {
        const newRecord = await AttendanceRecord.create({
          batchId,
          studentPersonId,
          tenantId,
          sessionDate,
          status,
          recordedOffline: recordedOffline || false,
          syncedAt: syncedAt ? new Date(syncedAt) : new Date()
        });
        syncedResults.push(newRecord);
      }
    } catch (error: any) {
      errors.push({ record, error: error.message });
    }
  }

  return sendSuccess(res, { synced: syncedResults.length, errors }, "Attendance synced successfully");
}
