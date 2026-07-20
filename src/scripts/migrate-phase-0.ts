import mongoose from "mongoose";
import { env } from "../config/env";
import { Municipality } from "../models/Municipality";
import { Tenant } from "../models/Tenant";
import { Ward } from "../models/Ward";
import { Branch } from "../models/Branch";
import { User } from "../models/User";
import { Person } from "../models/Person";
import { RoleAssignment } from "../models/RoleAssignment";
import { Role } from "../models/Role";

async function runMigration() {
  console.log("Connecting to database...");
  await mongoose.connect(env.DATABASE_URL);
  console.log("Connected.");

  console.log("Migrating Municipalities -> Tenants...");
  const municipalities = await Municipality.find();
  for (const mun of municipalities) {
    const existing = await Tenant.findOne({ code: mun.code });
    if (!existing) {
      await Tenant.create({
        _id: mun._id, // Keep the same ID for referential integrity
        name: mun.name,
        nameNp: mun.nameNp,
        code: mun.code,
        subdomain: mun.subdomain,
        district: mun.district,
        province: mun.province,
        type: "studio", // defaulted
        totalBranches: mun.totalWards,
        contactEmail: mun.contactEmail,
        contactPhone: mun.contactPhone,
        address: mun.address,
        logoUrl: mun.logoUrl,
        themeConfig: mun.themeConfig,
        isActive: mun.isActive,
        status: mun.status,
        createdAt: mun.createdAt,
        updatedAt: mun.updatedAt,
      });
      console.log(`Migrated Tenant: ${mun.name}`);
    }
  }

  console.log("Migrating Wards -> Branches...");
  const wards = await Ward.find();
  for (const ward of wards) {
    const existing = await Branch.findById(ward._id);
    if (!existing) {
      await Branch.create({
        _id: ward._id,
        tenantId: ward.municipalityId,
        name: `Branch ${ward.wardNumber}`,
        nameNp: ward.nameNp,
        address: ward.officeAddress,
        contactPhone: ward.contactPhone,
        isActive: ward.isActive,
        createdAt: ward.createdAt,
        updatedAt: ward.updatedAt,
      });
      console.log(`Migrated Branch: Branch ${ward.wardNumber}`);
    }
  }

  console.log("Migrating Users -> Persons & RoleAssignments...");
  const users = await User.find().populate("roles");
  for (const user of users) {
    let person = await Person.findById(user._id);
    if (!person) {
      person = await Person.create({
        _id: user._id,
        tenantId: user.municipalityId,
        fullName: user.name,
        phone: user.phone || "",
        email: user.email,
        authProvider: "auth0", // legacy users use auth0 usually
        password: user.password, // hashed password
        image: user.image,
        isActive: user.isActive,
        refreshToken: user.refreshToken,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
      console.log(`Migrated Person: ${person.fullName}`);
    }

    // Create role assignments
    const existingAssignments = await RoleAssignment.find({ personId: user._id });
    if (existingAssignments.length === 0) {
      const rolesSlugs = user.rolesSlugs || [];
      for (const slug of rolesSlugs) {
        let mappedRole = "client"; // default
        if (slug === "platform_admin") mappedRole = "owner";
        else if (slug === "municipality_admin") mappedRole = "branch_manager";
        else if (slug === "ward_officer") mappedRole = "branch_manager";
        else if (slug === "staff") mappedRole = "stylist";
        
        await RoleAssignment.create({
          personId: person._id,
          tenantId: user.municipalityId,
          branchId: user.wardId,
          role: mappedRole,
          status: user.isActive ? "active" : "inactive",
          startedAt: user.createdAt,
        });
        console.log(`Created RoleAssignment for ${person.fullName} -> ${mappedRole}`);
      }
    }
  }

  console.log("Migration Phase 0 completed successfully.");
  process.exit(0);
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
