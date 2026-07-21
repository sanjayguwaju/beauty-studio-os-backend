/**
 * Database Seed — Run once to bootstrap BeautyStudio OS
 * Usage: npx ts-node src/utils/seed.ts
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
import { FeatureFlag } from "../models/FeatureFlag";

export const SYSTEM_ROLES = [
  {
    name: "Platform Administrator",
    nameNp: "प्लेटफर्म प्रशासक",
    slug: "platform_admin",
    isSystem: true,
    level: 0,
    permissions: [{ module: "all", action: "manage" }],
  },
  {
    name: "Chairperson / Mayor",
    nameNp: "अध्यक्ष / मेयर",
    slug: "chairperson",
    isSystem: true,
    level: 1,
    permissions: [{ module: "all", action: "manage" }],
  },
  {
    name: "Vice-Chairperson / Deputy Mayor",
    nameNp: "उपाध्यक्ष / उपमेयर",
    slug: "vice_chairperson",
    isSystem: true,
    level: 2,
    permissions: [{ module: "all", action: "manage" }],
  },
  {
    name: "Chief Administrative Officer (CAO)",
    nameNp: "प्रमुख प्रशासकीय अधिकृत",
    slug: "cao",
    isSystem: true,
    level: 3,
    permissions: [{ module: "all", action: "manage" }],
  },
  {
    name: "Section Chief (Shakha Pramukh)",
    nameNp: "शाखा प्रमुख",
    slug: "section_chief",
    isSystem: true,
    level: 4,
    permissions: [
      "citizens","correspondence","service_requests","registration","complaints","dashboard"
    ].flatMap(m => ["create","read","update","approve"].map(a => ({ module: m, action: a }))),
  },
  {
    name: "Officer (Adhikrit)",
    nameNp: "अधिकृत",
    slug: "officer",
    isSystem: true,
    level: 5,
    permissions: [
      ...["citizens","service_requests","registration","complaints","correspondence"].flatMap(m =>
        ["create","read","update"].map(a => ({ module: m, action: a }))
      ),
      { module: "dashboard", action: "read" },
    ],
  },
  {
    name: "Assistant Officer",
    nameNp: "सहायक अधिकृत",
    slug: "assistant_officer",
    isSystem: true,
    level: 6,
    permissions: [
      ...["citizens","service_requests","registration","complaints"].flatMap(m =>
        ["create","read","update"].map(a => ({ module: m, action: a }))
      ),
      { module: "dashboard", action: "read" },
    ],
  },
  {
    name: "Senior Assistant",
    nameNp: "वरिष्ठ सहायक",
    slug: "senior_assistant",
    isSystem: true,
    level: 7,
    permissions: [
      ...["citizens","service_requests","registration","complaints"].flatMap(m =>
        ["create","read"].map(a => ({ module: m, action: a }))
      ),
      { module: "dashboard", action: "read" },
    ],
  },
  {
    name: "Assistant",
    nameNp: "सहायक",
    slug: "assistant",
    isSystem: true,
    level: 8,
    permissions: [
      ...["citizens","service_requests"].flatMap(m =>
        ["create","read"].map(a => ({ module: m, action: a }))
      ),
      { module: "dashboard", action: "read" },
    ],
  },
  {
    name: "Junior Assistant",
    nameNp: "कनिष्ठ सहायक",
    slug: "junior_assistant",
    isSystem: true,
    level: 9,
    permissions: [
      { module: "dashboard", action: "read" },
      { module: "notifications", action: "read" },
    ],
  },
  {
    name: "Support Staff",
    nameNp: "सहयोगी कर्मचारी",
    slug: "support_staff",
    isSystem: true,
    level: 10,
    permissions: [
      { module: "dashboard", action: "read" },
      { module: "notifications", action: "read" },
    ],
  },
  {
    name: "Citizen",
    nameNp: "नागरिक",
    slug: "citizen",
    isSystem: true,
    level: 99,
    permissions: [
      { module: "service_requests", action: "create" },
      { module: "service_requests", action: "read" },
      { module: "complaints", action: "create" },
    ],
  },
];

async function seed() {
  await connectDatabase();
  console.log("Seeding BeautyStudio OS...");

  // Municipality
  let municipality = await Municipality.findOne({ code: "BEAUTYSTUDIOOS" });
  if (!municipality) {
    municipality = await Municipality.create({
      name: "BeautyStudio OS Demo Studio",
      nameNp: "पालता गाउँपालिका",
      code: "BEAUTYSTUDIOOS",
      subdomain: "demo",
      district: "Kalikot",
      province: "Karnali Province",
      type: "rural",
      totalWards: 9,
      contactEmail: "info@demo.gov.np",
      isActive: true,
      status: "approved",
    });
    console.log("✓ Municipality created:", municipality.name);
  } else {
    console.log("✓ Municipality already exists");
  }

  // Wards
  const existingWards = await Ward.countDocuments({ municipalityId: municipality._id });
  if (existingWards === 0) {
    await Ward.insertMany(
      Array.from({ length: 9 }, (_, i) => ({
        municipalityId: municipality!._id,
        wardNumber: i + 1,
      })),
    );
    console.log("✓ Created 9 wards");
  }

  // Roles
  const createdRoles: Record<string, any> = {};
  for (const roleData of SYSTEM_ROLES) {
    let role = await Role.findOne({ slug: roleData.slug, municipalityId: municipality._id });
    if (!role) {
      role = await Role.create({ ...roleData, municipalityId: municipality._id });
      console.log(`✓ Role created: ${role.slug}`);
    } else {
      // Update existing role to match new level/permissions
      Object.assign(role, roleData);
      await role.save();
    }
    createdRoles[roleData.slug] = role;
  }

  // Super-admin user (Platform Administrator)
  const superAdminEmail = "superadmin@platform.gov.np";
  const existingSuper = await User.findOne({ email: superAdminEmail });
  if (!existingSuper) {
    const platformRole = createdRoles["platform_admin"];
    await User.create({
      name: "Platform Administrator",
      email: superAdminEmail,
      password: "Super@1234",
      municipalityId: municipality._id, // Ideally null for global, but keeping as is for schema
      roles: [platformRole._id],
      rolesSlugs: ["platform_admin"],
      isActive: true,
      designation: "System Architect",
    });
    console.log("✓ Platform admin user created: superadmin@platform.gov.np / Super@1234");
  }

  // Municipality Admin user (CAO)
  const adminEmail = "admin@demo.gov.np";
  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    const adminRole = createdRoles["cao"];
    await User.create({
      name: "Chief Administrative Officer",
      email: adminEmail,
      password: "Admin@1234",
      municipalityId: municipality._id,
      roles: [adminRole._id],
      rolesSlugs: ["cao"],
      isActive: true,
      designation: "CAO",
    });
    console.log("✓ Municipality admin (CAO) user created: admin@demo.gov.np / Admin@1234");
    console.log("  !! Change this password immediately after first login !!");
  }

  // Ward officer demo user (Officer)
  const wardOfficerEmail = "ward1@demo.gov.np";
  const existingWO = await User.findOne({ email: wardOfficerEmail });
  if (!existingWO) {
    const ward1 = await Ward.findOne({ municipalityId: municipality._id, wardNumber: 1 });
    const woRole = createdRoles["officer"];
    await User.create({
      name: "Ward 1 Officer",
      email: wardOfficerEmail,
      password: "Ward1@1234",
      municipalityId: municipality._id,
      wardId: ward1?._id,
      roles: [woRole._id],
      rolesSlugs: ["officer"],
      isActive: true,
      designation: "Ward Secretary",
    });
    console.log("✓ Ward officer created: ward1@demo.gov.np / Ward1@1234");
  }

  // Section Head demo user
  const sectionHeadEmail = "section@demo.gov.np";
  const existingSection = await User.findOne({ email: sectionHeadEmail });
  if (!existingSection) {
    const sectionRole = createdRoles["section_chief"];
    await User.create({
      name: "Section Head 1",
      email: sectionHeadEmail,
      password: "Section@1234",
      municipalityId: municipality._id,
      roles: [sectionRole._id],
      rolesSlugs: ["section_chief"],
      isActive: true,
      designation: "IT Officer",
    });
    console.log("✓ Section head created: section@demo.gov.np / Section@1234");
  }

  // Staff demo user
  const staffEmail = "staff@demo.gov.np";
  const existingStaff = await User.findOne({ email: staffEmail });
  if (!existingStaff) {
    const staffRole = createdRoles["support_staff"];
    await User.create({
      name: "Staff 1",
      email: staffEmail,
      password: "Staff@1234",
      municipalityId: municipality._id,
      roles: [staffRole._id],
      rolesSlugs: ["support_staff"],
      isActive: true,
      designation: "Support Staff",
    });
    console.log("✓ Staff created: staff@demo.gov.np / Staff@1234");
  }

  // Citizen demo user
  const citizenEmail = "citizen@demo.gov.np";
  const existingCitizenAuth = await User.findOne({ email: citizenEmail });
  if (!existingCitizenAuth) {
    const citizenRole = createdRoles["citizen"];
    await User.create({
      name: "Citizen 1",
      email: citizenEmail,
      password: "Citizen@1234",
      municipalityId: municipality._id,
      roles: [citizenRole._id],
      rolesSlugs: ["citizen"],
      isActive: true,
    });
    console.log("✓ Citizen user created: citizen@demo.gov.np / Citizen@1234");
  }
  const adminUser = existing || await User.findOne({ email: adminEmail });
  const ward1 = await Ward.findOne({ municipalityId: municipality._id, wardNumber: 1 });

  // Citizens
  const citizensCount = await Citizen.countDocuments({ municipalityId: municipality._id });
  let citizen = await Citizen.findOne({ municipalityId: municipality._id, citizenshipNumber: "123456" });
  if (citizensCount < 3 && ward1) {
    const citizensData = [
      {
        municipalityId: municipality._id,
        wardId: ward1._id,
        firstName: "Ram", lastName: "Bahadur",
        firstNameNp: "राम", lastNameNp: "बहादुर",
        citizenshipNumber: "123456", citizenshipIssuedDistrict: "Kalikot",
        gender: "male", dateOfBirthBs: "2040-01-01", mobileNumber: "9840000000",
      },
      {
        municipalityId: municipality._id,
        wardId: ward1._id,
        firstName: "Sita", lastName: "Kumari",
        firstNameNp: "सीता", lastNameNp: "कुमारी",
        citizenshipNumber: "123457", citizenshipIssuedDistrict: "Kalikot",
        gender: "female", dateOfBirthBs: "2042-05-12", mobileNumber: "9840000001",
      },
      {
        municipalityId: municipality._id,
        wardId: ward1._id,
        firstName: "Hari", lastName: "Prasad",
        firstNameNp: "हरि", lastNameNp: "प्रसाद",
        citizenshipNumber: "123458", citizenshipIssuedDistrict: "Kalikot",
        gender: "male", dateOfBirthBs: "2035-10-22", mobileNumber: "9840000002",
      }
    ];
    for (const cData of citizensData) {
      const exists = await Citizen.findOne({ citizenshipNumber: cData.citizenshipNumber });
      if (!exists) {
        citizen = await Citizen.create(cData);
      }
    }
    console.log("✓ Citizens seeded");
  }

  // Complaints
  const complaintsCount = await Complaint.countDocuments({ municipalityId: municipality._id });
  if (complaintsCount < 3 && ward1) {
    const complaintsData = [
      {
        municipalityId: municipality._id, wardId: ward1._id,
        trackingNumber: "CMP-0001", subject: "Water Supply Issue",
        description: "No water in Ward 1 for the past 2 days.",
        complainantName: "Ram Bahadur", complainantPhone: "9840000000", status: "received",
      },
      {
        municipalityId: municipality._id, wardId: ward1._id,
        trackingNumber: "CMP-0002", subject: "Road Maintenance",
        description: "Potholes on the main road to the market.",
        complainantName: "Sita Kumari", complainantPhone: "9840000001", status: "under_investigation",
      },
      {
        municipalityId: municipality._id, wardId: ward1._id,
        trackingNumber: "CMP-0003", subject: "Garbage Collection",
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
        municipalityId: municipality._id, referenceNumber: "COR-2081-001", fiscalYear: "2081/82",
        sequenceNumber: 1, type: "letter", direction: "outgoing",
        subject: "Budget Allocation 2081/82", dateBs: "2081-01-05", status: "sent", toEntity: "Ministry of Finance"
      },
      {
        municipalityId: municipality._id, referenceNumber: "COR-2081-002", fiscalYear: "2081/82",
        sequenceNumber: 2, type: "notice", direction: "incoming",
        subject: "Public Holiday Notice", dateBs: "2081-01-15", status: "received", fromEntity: "Ministry of Home Affairs"
      },
      {
        municipalityId: municipality._id, referenceNumber: "COR-2081-003", fiscalYear: "2081/82",
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
        trackingNumber: "SR-0001", serviceType: "Business Registration",
        applicantName: "Ram Bahadur", applicantPhone: "9840000000", status: "submitted",
      },
      {
        municipalityId: municipality._id, wardId: ward1._id, citizenId: citizen._id,
        trackingNumber: "SR-0002", serviceType: "Vital Registration",
        applicantName: "Ram Bahadur", applicantPhone: "9840000000", status: "under_review",
      },
      {
        municipalityId: municipality._id, wardId: ward1._id, citizenId: citizen._id,
        trackingNumber: "SR-0003", serviceType: "Recommendation Letter",
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
  let birthReg = await BirthRegistration.findOne({ registrationNumber: "BR-0001" });
  if (!birthReg && ward1 && citizen) {
    birthReg = await BirthRegistration.create({
      municipalityId: municipality._id,
      wardId: ward1._id,
      registrationNumber: "BR-0001",
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

  // Feature Flags
  const flagCount = await FeatureFlag.countDocuments({ municipalityId: municipality._id });
  if (flagCount === 0) {
    await FeatureFlag.insertMany([
      { municipalityId: municipality._id, key: "online_payment", name: "Online Payment", description: "Enable online tax payment", isActive: true },
      { municipalityId: municipality._id, key: "sms_notifications", name: "SMS Notifications", description: "Send SMS alerts to citizens", isActive: false },
      { municipalityId: municipality._id, key: "citizen_portal", name: "Citizen Portal", description: "Enable the public citizen portal", isActive: true },
    ]);
    console.log("✓ Feature flags seeded");
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
        payerName: "Ram Bahadur", amountNpr: 1500, receiptNumber: "REC-2081-001",
        dateBs: "2081-01-05", collectedBy: adminUser._id
      },
      {
        municipalityId: municipality._id, wardId: ward1._id, revenueType: "business_registration",
        payerName: "Sita Kumari", amountNpr: 5000, receiptNumber: "REC-2081-002",
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
        registrationNumber: "DR-0001",
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
        registrationNumber: "MR-0001",
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

  console.log("\nSeed complete ✓");
  await mongoose.disconnect();
}

if (require.main === module) {
  seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
