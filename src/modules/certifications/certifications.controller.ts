import { Response } from "express";
import { AuthRequest } from "../../types";
import { CertificationRequirement } from "../../models/CertificationRequirement";
import { CertificationStatus } from "../../models/CertificationStatus";
import { Certificate } from "../../models/Certificate";
import { CurriculumProgressCredit } from "../../models/CurriculumProgressCredit";
import { sendSuccess, sendError } from "../../utils/response";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { notificationQueue } from "../../queue/notification.queue";
import { Person } from "../../models/Person";

// --- Requirements Management ---

export async function listRequirements(req: AuthRequest, res: Response) {
  const { courseId } = req.query;
  const filter = courseId ? { courseId } : {};
  
  const requirements = await CertificationRequirement.find(filter)
    .populate("targetCurriculumItemId", "title type")
    .lean();
    
  return sendSuccess(res, requirements);
}

export async function createRequirement(req: AuthRequest, res: Response) {
  const requirement = await CertificationRequirement.create(req.body);
  return sendSuccess(res, requirement, "Requirement created", 201);
}

// --- Status Tracking & Certificate Generation ---

export async function recalculateStatus(studentPersonId: string, courseId: string) {
  // Get all requirements for the course
  const requirements = await CertificationRequirement.find({ courseId });
  
  for (const req of requirements) {
    let status = await CertificationStatus.findOne({ studentPersonId, requirementId: req._id });
    if (!status) {
      status = new CertificationStatus({ studentPersonId, courseId, requirementId: req._id });
    }

    if (status.satisfied && !status.overrideByPersonId) {
       // If it's already satisfied (and not manually overridden), we could skip, 
       // but we might want to recalculate anyway in case rules changed.
    }

    if (req.ruleType === "supervised_count" && req.targetCurriculumItemId) {
      const count = await CurriculumProgressCredit.countDocuments({
        studentPersonId,
        curriculumItemId: req.targetCurriculumItemId
      });
      status.currentValue = count;
      status.satisfied = count >= req.thresholdValue;
      if (status.satisfied && !status.satisfiedAt) {
        status.satisfiedAt = new Date();
      } else if (!status.satisfied) {
        status.satisfiedAt = undefined;
      }
    }
    
    // Add logic for solo_count, exam_pass, attendance_percentage as needed

    await status.save();
  }
}

export async function getStudentStatus(req: AuthRequest, res: Response) {
  const { studentPersonId, courseId } = req.params;
  const statuses = await CertificationStatus.find({ studentPersonId, courseId })
    .populate("requirementId");
  return sendSuccess(res, statuses);
}

export async function overrideStatus(req: AuthRequest, res: Response) {
  const { statusId } = req.params;
  const instructorId = req.user!.personId;
  
  const status = await CertificationStatus.findById(statusId);
  if (!status) return sendError(res, 404, "Status not found");

  status.satisfied = true;
  status.satisfiedAt = new Date();
  status.overrideByPersonId = instructorId as any; // Note: Ensure req.user has personId or use req.user.id depending on auth design
  
  await status.save();
  return sendSuccess(res, status, "Requirement manually overridden");
}

export async function issueCertificate(req: AuthRequest, res: Response) {
  const { studentPersonId, courseId } = req.body;
  
  // 1. Verify all requirements are satisfied
  const requirements = await CertificationRequirement.find({ courseId });
  const statuses = await CertificationStatus.find({ studentPersonId, courseId });
  
  const allSatisfied = requirements.every(req => {
    const st = statuses.find(s => s.requirementId.toString() === req._id.toString());
    return st && st.satisfied;
  });

  if (!allSatisfied) {
    return sendError(res, 400, "Cannot issue certificate: Not all requirements are met.");
  }

  // 2. Generate PDF using Puppeteer
  const certNumber = `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          h1 { color: #2c3e50; font-size: 50px; margin-bottom: 10px; }
          h2 { color: #34495e; font-size: 30px; margin-bottom: 40px; }
          p { font-size: 20px; color: #7f8c8d; }
          .student-name { font-size: 40px; font-weight: bold; color: #e74c3c; margin: 20px 0; }
          .cert-number { margin-top: 50px; font-size: 14px; color: #bdc3c7; }
        </style>
      </head>
      <body>
        <h1>Certificate of Completion</h1>
        <h2>Beauty Studio Academy</h2>
        <p>This is to certify that</p>
        <div class="student-name">Student ID: ${studentPersonId}</div>
        <p>has successfully completed the course</p>
        <h2>Course ID: ${courseId}</h2>
        <div class="cert-number">Certificate Number: ${certNumber}</div>
      </body>
    </html>
  `;

  // Provide a placeholder URL in the MVP unless we actually upload to R2
  // We'll generate a base64 or save locally for demonstration
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  const pdfBuffer = await page.pdf({ format: 'A4', landscape: true });
  await browser.close();

  // In production, upload pdfBuffer to S3/R2 and get URL. Here we just create a record.
  const certificate = await Certificate.create({
    studentPersonId,
    courseId,
    certificateNumber: certNumber,
    pdfUrl: "https://example-bucket.s3.amazonaws.com/cert.pdf" // Placeholder
  });

  // Phase 7: Trigger Certificate Ready Notification
  const student = await Person.findById(studentPersonId);
  if (student) {
    const tenantId = req.user!.tenantId || req.user!.municipalityId;
    notificationQueue.add({
      tenantId,
      triggerType: "certificate_ready",
      personId: studentPersonId,
      recipientContact: student.email || student.phone || "student_contact_placeholder",
      variables: {
        clientName: student.fullName,
        certNumber: certNumber
      }
    });
  }

  return sendSuccess(res, certificate, "Certificate issued successfully", 201);
}
