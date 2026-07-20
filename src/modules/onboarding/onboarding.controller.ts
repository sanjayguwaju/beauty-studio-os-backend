import { Request, Response } from "express";
import { body } from "express-validator";
import { Municipality } from "../../models/Municipality";
import { Ward } from "../../models/Ward";
import { Role } from "../../models/Role";
import { User } from "../../models/User";
import { SYSTEM_ROLES } from "../../utils/seed";
import { sendSuccess, sendError } from "../../utils/response";
import { signAccessToken, signRefreshToken } from "../../utils/jwt";
import bcrypt from "bcryptjs";
import { AuditLog } from "../../models/AuditLog";

export const registerMunicipalityValidation = [
  body("name").notEmpty().withMessage("Municipality name is required"),
  body("subdomain")
    .notEmpty().withMessage("Subdomain is required")
    .matches(/^[a-z0-9-]+$/).withMessage("Subdomain must be lowercase alphanumeric and hyphens only"),
  body("adminName").notEmpty().withMessage("Admin name is required"),
  body("adminEmail").isEmail().normalizeEmail().withMessage("Valid admin email is required"),
  body("adminPassword").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

export async function registerMunicipality(req: Request, res: Response) {
  const { name, subdomain, adminName, adminEmail, adminPassword } = req.body;

  try {
    // 1. Check if subdomain already exists
    const existingMuni = await Municipality.findOne({ subdomain });
    if (existingMuni) {
      return sendError(res, 400, "Subdomain is already taken");
    }

    // 2. Check if admin email already exists globally
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      return sendError(res, 400, "Admin email is already registered");
    }

    // 3. Create Municipality
    const municipality = await Municipality.create({
      name,
      code: subdomain.toUpperCase(),
      subdomain,
      type: "rural",
      totalWards: 9,
      isActive: true,
    });

    // 4. Create Wards
    await Ward.insertMany(
      Array.from({ length: 9 }, (_, i) => ({
        municipalityId: municipality._id,
        wardNumber: i + 1,
      }))
    );

    // 5. Create Roles
    const createdRoles: Record<string, any> = {};
    for (const roleData of SYSTEM_ROLES) {
      const role = await Role.create({ ...roleData, municipalityId: municipality._id });
      createdRoles[roleData.slug] = role;
    }

    // 6. Create Admin User (Platform Admin or CAO)
    const adminRole = createdRoles["platform_admin"]; // Give them full access to their tenant
    const user = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      municipalityId: municipality._id,
      roles: [adminRole._id],
      rolesSlugs: ["platform_admin"],
      isActive: true,
      designation: "System Administrator",
    });

    // 7. Success Response (No auto-login since approval is required)
    await AuditLog.create({
      municipalityId: user.municipalityId,
      actorId: user._id,
      actorEmail: user.email,
      module: "system",
      action: "TENANT_CREATED",
      entityType: "Municipality",
      entityId: municipality._id,
      description: `New municipality ${name} registered`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, {
      municipality: {
        id: municipality._id,
        name: municipality.name,
        subdomain: municipality.subdomain,
      }
    }, "Workspace created successfully! It is currently pending verification by our administration team.", 201);

  } catch (err: any) {
    return sendError(res, 500, "Failed to register municipality: " + err.message);
  }
}
