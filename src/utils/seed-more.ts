/**
 * Database Seed — Seed more tenants
 * Usage: npx ts-node src/utils/seed-more.ts
 */
import mongoose from "mongoose";
import { connectDatabase } from "../config/database";
import { Municipality } from "../models/Municipality";
import { Ward } from "../models/Ward";
import { Role } from "../models/Role";
import { User } from "../models/User";
import { Citizen } from "../models/Citizen";
import { Complaint } from "../models/Complaint";
import { Correspondence } from "../models/Correspondence";
import { ServiceRequest } from "../models/ServiceRequest";
import { Notification } from "../models/Notification";
import { AuditLog } from "../models/AuditLog";
import { BirthRegistration, DeathRegistration, MarriageRegistration, MigrationRegistration } from "../models/Registration";
import { BudgetAllocation } from "../models/BudgetAllocation";
import { RevenueCollection } from "../models/RevenueCollection";
import { LedgerEntry } from "../models/LedgerEntry";
import { TaxRule } from "../models/TaxRule";
import { Payment } from "../models/Payment";
import { Subscription } from "../models/Subscription";
import { SYSTEM_ROLES } from "./seed";


const NEW_TENANTS = [
  {
    name: "Palata Rural Municipality",
    nameNp: "पलाता गाउँपालिका",
    code: "PALATA",
    subdomain: "palata",
    district: "Kalikot",
    province: "Karnali Province",
    type: "rural",
    totalWards: 9,
    contactEmail: "info@palata.gov.np",
    isActive: true,
    status: "approved",
  },
  {
    name: "Kathmandu Metropolitan City",
    nameNp: "काठमाडौं महानगरपालिका",
    code: "KTM",
    subdomain: "kathmandu",
    district: "Kathmandu",
    province: "Bagmati Province",
    type: "metropolitan",
    totalWards: 32,
    contactEmail: "info@kathmandu.gov.np",
    isActive: true,
    status: "approved",
  },
  {
    name: "Lalitpur Metropolitan City",
    nameNp: "ललितपुर महानगरपालिका",
    code: "LALITPUR",
    subdomain: "lalitpur",
    district: "Lalitpur",
    province: "Bagmati Province",
    type: "metropolitan",
    totalWards: 29,
    contactEmail: "info@lalitpur.gov.np",
    isActive: true,
    status: "approved",
  },
  {
    name: "Pokhara Metropolitan City",
    nameNp: "पोखरा महानगरपालिका",
    code: "POKHARA",
    subdomain: "pokhara",
    district: "Kaski",
    province: "Gandaki Province",
    type: "metropolitan",
    totalWards: 33,
    contactEmail: "info@pokhara.gov.np",
    isActive: true,
    status: "approved",
  }
];

async function seedMore() {
  await connectDatabase();
  console.log("Seeding more tenants...");

  for (const t of NEW_TENANTS) {
    console.log(`\n--- Seeding Tenant: ${t.name} ---`);
    
    // Municipality
    let municipality = await Municipality.findOne({ code: t.code });
    if (!municipality) {
      municipality = await Municipality.create(t);
      console.log("✓ Municipality created:", municipality.name);
    } else {
      console.log("✓ Municipality already exists");
    }

    // Wards
    const existingWards = await Ward.countDocuments({ municipalityId: municipality._id });
    if (existingWards === 0) {
      await Ward.insertMany(
        Array.from({ length: t.totalWards }, (_, i) => ({
          municipalityId: municipality!._id,
          wardNumber: i + 1,
        }))
      );
      console.log(`✓ Created ${t.totalWards} wards`);
    }

    // Roles
    const createdRoles: Record<string, any> = {};
    for (const roleData of SYSTEM_ROLES) {
      let role = await Role.findOne({ slug: roleData.slug, municipalityId: municipality._id });
      if (!role) {
        role = await Role.create({ ...roleData, municipalityId: municipality._id });
      }
      createdRoles[roleData.slug] = role;
    }
    console.log("✓ Roles seeded");

    // Municipality Admin user (CAO)
    const adminEmail = `admin@${t.subdomain}.gov.np`;
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const adminRole = createdRoles["cao"];
      await User.create({
        name: `CAO - ${t.name}`,
        email: adminEmail,
        password: "Admin@1234",
        municipalityId: municipality._id,
        roles: [adminRole._id],
        rolesSlugs: ["cao"],
        isActive: true,
        designation: "CAO",
      });
      console.log(`✓ Admin user created: ${adminEmail} / Admin@1234`);
    }

    // Ward officer demo user
    const wardOfficerEmail = `ward1@${t.subdomain}.gov.np`;
    const existingWO = await User.findOne({ email: wardOfficerEmail });
    if (!existingWO) {
      const ward1 = await Ward.findOne({ municipalityId: municipality._id, wardNumber: 1 });
      const woRole = createdRoles["officer"];
      await User.create({
        name: `Ward 1 Officer - ${t.name}`,
        email: wardOfficerEmail,
        password: "Ward1@1234",
        municipalityId: municipality._id,
        wardId: ward1?._id,
        roles: [woRole._id],
        rolesSlugs: ["officer"],
        isActive: true,
        designation: "Ward Secretary",
      });
      console.log(`✓ Ward officer created: ${wardOfficerEmail} / Ward1@1234`);
    }

    // Citizen demo user
    const citizenEmail = `citizen@${t.subdomain}.gov.np`;
    const existingCitizenAuth = await User.findOne({ email: citizenEmail });
    if (!existingCitizenAuth) {
      const citizenRole = createdRoles["citizen"];
      await User.create({
        name: `Citizen 1 - ${t.name}`,
        email: citizenEmail,
        password: "Citizen@1234",
        municipalityId: municipality._id,
        roles: [citizenRole._id],
        rolesSlugs: ["citizen"],
        isActive: true,
      });
      console.log(`✓ Citizen user created: ${citizenEmail} / Citizen@1234`);
    }
    
    // Seed some basic citizens
    const citizensCount = await Citizen.countDocuments({ municipalityId: municipality._id });
    if (citizensCount < 1) {
      const w1 = await Ward.findOne({ municipalityId: municipality._id, wardNumber: 1 });
      if (w1) {
        await Citizen.create({
          municipalityId: municipality._id,
          wardId: w1._id,
          firstName: "Sample", lastName: "Citizen",
          firstNameNp: "नमुना", lastNameNp: "नागरिक",
          citizenshipNumber: `123-${t.code}`, citizenshipIssuedDistrict: t.district,
          gender: "male", dateOfBirthBs: "2040-01-01", mobileNumber: "9800000000",
        });
        console.log("✓ Demo citizen seeded");
      }
    }

    const adminUser = existingAdmin || await User.findOne({ email: adminEmail });
    const ward1 = await Ward.findOne({ municipalityId: municipality._id, wardNumber: 1 });
    const citizen = await Citizen.findOne({ municipalityId: municipality._id });
  // Complaints
  const complaintsCount = await Complaint.countDocuments({ municipalityId: municipality._id });
  if (complaintsCount < 3 && ward1) {
    const complaintsData = [
      {
        municipalityId: municipality._id, wardId: ward1._id,
        trackingNumber: `CMP-0001-${t.code}`, subject: "Water Supply Issue",
        description: "No water in Ward 1 for the past 2 days.",
        complainantName: "Ram Bahadur", complainantPhone: "9840000000", status: "received",
      },
      {
        municipalityId: municipality._id, wardId: ward1._id,
        trackingNumber: `CMP-0002-${t.code}`, subject: "Road Maintenance",
        description: "Potholes on the main road to the market.",
        complainantName: "Sita Kumari", complainantPhone: "9840000001", status: "under_investigation",
      },
      {
        municipalityId: municipality._id, wardId: ward1._id,
        trackingNumber: `CMP-0003-${t.code}`, subject: "Garbage Collection",
        description: "Garbage has not been collected this week.",
        complainantName: "Hari Prasad", complainantPhone: "9840000002", status: "resolved",
      }
    ];
    for (const data of complaintsData) {
      const exists = await Complaint.findOne({ trackingNumber: data.trackingNumber });
      if (!exists) await Complaint.create(data);
    }
    console.log("✓ Complaints seeded");
  }

  // Correspondence
  const correspondenceCount = await Correspondence.countDocuments({ municipalityId: municipality._id });
  if (correspondenceCount < 3) {
    const corrData = [
      {
        municipalityId: municipality._id, referenceNumber: `COR-2081-001-${t.code}`, fiscalYear: "2081/82",
        sequenceNumber: 1, type: "letter", direction: "outgoing",
        subject: "Budget Allocation 2081/82", dateBs: "2081-01-05", status: "sent", toEntity: "Ministry of Finance"
      },
      {
        municipalityId: municipality._id, referenceNumber: `COR-2081-002-${t.code}`, fiscalYear: "2081/82",
        sequenceNumber: 2, type: "notice", direction: "incoming",
        subject: "Public Holiday Notice", dateBs: "2081-01-15", status: "received", fromEntity: "Ministry of Home Affairs"
      },
      {
        municipalityId: municipality._id, referenceNumber: `COR-2081-003-${t.code}`, fiscalYear: "2081/82",
        sequenceNumber: 3, type: "letter", direction: "internal",
        subject: "Staff Meeting Update", dateBs: "2081-02-01", status: "draft",
      }
    ];
    for (const data of corrData) {
      const exists = await Correspondence.findOne({ referenceNumber: data.referenceNumber });
      if (!exists) await Correspondence.create(data);
    }
    console.log("✓ Correspondences seeded");
  }

  // Service Requests
  const srCount = await ServiceRequest.countDocuments({ municipalityId: municipality._id });
  if (srCount < 3 && ward1 && citizen) {
    const srData = [
      {
        municipalityId: municipality._id, wardId: ward1._id, citizenId: citizen._id,
        trackingNumber: `SR-0001-${t.code}`, serviceType: "Business Registration",
        applicantName: "Ram Bahadur", applicantPhone: "9840000000", status: "submitted",
      },
      {
        municipalityId: municipality._id, wardId: ward1._id, citizenId: citizen._id,
        trackingNumber: `SR-0002-${t.code}`, serviceType: "Vital Registration",
        applicantName: "Ram Bahadur", applicantPhone: "9840000000", status: "under_review",
      },
      {
        municipalityId: municipality._id, wardId: ward1._id, citizenId: citizen._id,
        trackingNumber: `SR-0003-${t.code}`, serviceType: "Recommendation Letter",
        applicantName: "Ram Bahadur", applicantPhone: "9840000000", status: "approved",
      }
    ];
    for (const data of srData) {
      const exists = await ServiceRequest.findOne({ trackingNumber: data.trackingNumber });
      if (!exists) await ServiceRequest.create(data);
    }
    console.log("✓ Service Requests seeded");
  }

  // Registrations (Birth)
  let birthReg = await BirthRegistration.findOne({ registrationNumber: `BR-0001-${t.code}` });
  if (!birthReg && ward1 && citizen) {
    birthReg = await BirthRegistration.create({
      municipalityId: municipality._id,
      wardId: ward1._id,
      registrationNumber: `BR-0001-${t.code}`,
      registrationDateBs: "2081-01-10",
      childName: "Shyam Bahadur",
      dateOfBirthBs: "2081-01-05",
      gender: "male",
      fatherName: "Ram Bahadur",
      fatherCitizenshipNo: "123456",
      fatherId: citizen._id,
      status: "verified",
    });
    console.log("✓ Birth Registration created");
  }

  // Notification
  if (adminUser) {
    const existingNotif = await Notification.findOne({ recipientId: adminUser._id });
    if (!existingNotif) {
      await Notification.create({
        municipalityId: municipality._id,
        recipientId: adminUser._id,
        title: "Welcome to BeautyStudio OS",
        body: "Your account has been created successfully.",
        channel: "in-app",
        type: "system",
      });
      console.log("✓ Notification created");
    }
  }

  // Audit Log
  const existingLog = await AuditLog.findOne({ action: "SYSTEM_SEED" });
  if (!existingLog && adminUser) {
    await AuditLog.create({
      municipalityId: municipality._id,
      actorId: adminUser._id,
      actorEmail: adminUser.email,
      module: "system",
      action: "SYSTEM_SEED",
      entityType: "System",
      description: "Initial database seed completed",
      ipAddress: "127.0.0.1",
    });
    console.log("✓ Audit Log created");
  }

  // Phase 3 — Budget Allocation
  const budgetCount = await BudgetAllocation.countDocuments({ municipalityId: municipality._id });
  if (budgetCount === 0 && ward1) {
    const allocations = [
      { municipalityId: municipality._id, fiscalYear: "2081/82", sectionSlug: "health", allocatedAmountNpr: 1000000, status: "approved" },
      { municipalityId: municipality._id, fiscalYear: "2081/82", sectionSlug: "education", allocatedAmountNpr: 1500000, status: "approved" },
      { municipalityId: municipality._id, fiscalYear: "2081/82", sectionSlug: "infrastructure", allocatedAmountNpr: 5000000, status: "approved" },
      { municipalityId: municipality._id, fiscalYear: "2081/82", sectionSlug: "finance", allocatedAmountNpr: 200000, status: "approved" },
    ];
    await BudgetAllocation.insertMany(allocations);
    console.log("✓ Budget Allocations seeded");
  }

  // Phase 3 — Revenue Collection
  const revenueCount = await RevenueCollection.countDocuments({ municipalityId: municipality._id });
  if (revenueCount === 0 && ward1 && adminUser) {
    const revenues = [
      {
        municipalityId: municipality._id, wardId: ward1._id, revenueType: "property_tax",
        payerName: "Ram Bahadur", amountNpr: 1500, receiptNumber: `REC-2081-001-${t.code}`,
        dateBs: "2081-01-05", collectedBy: adminUser._id
      },
      {
        municipalityId: municipality._id, wardId: ward1._id, revenueType: "business_registration",
        payerName: "Sita Kumari", amountNpr: 5000, receiptNumber: `REC-2081-002-${t.code}`,
        dateBs: "2081-01-10", collectedBy: adminUser._id
      }
    ];
    for (const data of revenues) {
      const rev = await RevenueCollection.create(data as any);
      await LedgerEntry.create({
        municipalityId: municipality._id, wardId: ward1._id, type: "income",
        amountNpr: rev.amountNpr, sourceModule: "finance", sourceRecordId: rev._id,
        description: `Revenue: ${rev.revenueType.replace("_", " ")} - ${rev.payerName}`, dateBs: rev.dateBs
      });
    }
    console.log("✓ Revenue Collections seeded");
  }

  // Phase 4 — Tax Engine (Tax Rules)
  const taxRuleCount = await TaxRule.countDocuments({ municipalityId: municipality._id });
  if (taxRuleCount === 0) {
    const rules = [
      {
        municipalityId: municipality._id,
        taxType: "property",
        name: "Residential Property Tax",
        fiscalYear: "2081/82",
        baseRate: 500,
        multiplier: 1,
        conditions: { propertyType: "residential" },
        isActive: true,
      },
      {
        municipalityId: municipality._id,
        taxType: "business",
        name: "Retail Shop Registration",
        fiscalYear: "2081/82",
        baseRate: 1500,
        multiplier: 1,
        conditions: { businessType: "retail" },
        isActive: true,
      }
    ];
    await TaxRule.insertMany(rules);
    console.log("✓ Tax Rules seeded");
  }

  // Phase 4 — SaaS Billing & Subscriptions
  const existingSub = await Subscription.findOne({ municipalityId: municipality._id });
  if (!existingSub) {
    await Subscription.create({
      municipalityId: municipality._id,
      planName: "PREMIUM",
      status: "active",
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      price: 50000,
    });
    console.log("✓ Subscription seeded");
  }

  // Phase 4 — Other Ghatana Darta (Death, Marriage)
  if (ward1 && citizen) {
    const deathRegCount = await DeathRegistration.countDocuments({ municipalityId: municipality._id });
    if (deathRegCount === 0) {
      await DeathRegistration.create({
        municipalityId: municipality._id,
        wardId: ward1._id,
        registrationNumber: `DR-0001-${t.code}`,
        registrationDateBs: "2081-02-01",
        deceasedName: "Hari Bahadur",
        dateOfDeathBs: "2081-01-20",
        causeOfDeath: "Natural",
        gender: "male",
        informantName: "Ram Bahadur",
        citizenId: citizen._id,
        status: "verified"
      });
      console.log("✓ Death Registration seeded");
    }

    const marriageRegCount = await MarriageRegistration.countDocuments({ municipalityId: municipality._id });
    if (marriageRegCount === 0) {
      await MarriageRegistration.create({
        municipalityId: municipality._id,
        wardId: ward1._id,
        registrationNumber: `MR-0001-${t.code}`,
        registrationDateBs: "2081-03-01",
        groomName: "Ram Bahadur",
        groomId: citizen._id,
        brideName: "Sita Kumari",
        marriageDateBs: "2081-02-15",
        marriageType: "arranged",
        status: "verified"
      });
      console.log("✓ Marriage Registration seeded");
    }
  }

  }

  console.log("\nSeed complete ✓");
  await mongoose.disconnect();
}

if (require.main === module) {
  seedMore().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
