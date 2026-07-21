import { Response } from "express";
import { AuthRequest } from "../../types";
import { Invoice } from "../../models/Invoice";
import { Commission } from "../../models/Commission";
import { sendSuccess, sendError } from "../../utils/response";
import { generatePdfFromHtml } from "../../utils/pdfGenerator";
import { generateInvoiceHtml, InvoiceData } from "../../templates/pdf/invoice";

export async function listInvoices(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const { type } = req.query; // "service" | "course_fee"
  
  const filter: any = { tenantId };
  if (type) filter.type = type;

  const invoices = await Invoice.find(filter)
    .populate("clientOrStudentPersonId", "fullName email phone")
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, invoices);
}

export async function createCourseFeeInvoice(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId || req.user!.municipalityId;
  const branchId = req.user!.branchId || req.body.branchId;

  const { studentPersonId, enrollmentId, lineItems, totalAmount } = req.body;

  const invoice = await Invoice.create({
    tenantId,
    branchId,
    type: "course_fee",
    clientOrStudentPersonId: studentPersonId,
    enrollmentId,
    lineItems,
    totalAmount
  });

  return sendSuccess(res, invoice, "Course fee invoice created", 201);
}

export async function posCheckout(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.user!.tenantId || req.user!.municipalityId;
    const branchId = req.user!.branchId || req.body.branchId;
    const { clientPersonId, lineItems, paymentMethod } = req.body;

    // Calculate totals
    const subtotal = lineItems.reduce((acc: number, item: any) => acc + (item.amount * item.quantity), 0);
    const tax = subtotal * 0.13; // 13% tax
    const totalAmount = subtotal + tax;

    // We map standard quantities to total item amount in ILineItem (which only expects amount/description)
    const dbLineItems = lineItems.map((item: any) => ({
      description: `${item.quantity}x ${item.name}`,
      amount: item.amount * item.quantity
    }));

    const invoice = await Invoice.create({
      tenantId,
      branchId,
      type: "service",
      clientOrStudentPersonId: clientPersonId || null, // Allow null for walk-ins if schema permits, else handle dummy user
      lineItems: dbLineItems,
      totalAmount,
      status: "paid" // POS assumes paid immediately
    });

    return sendSuccess(res, invoice, "Checkout successful", 201);
  } catch (error) {
    console.error("POS Checkout Error:", error);
    return sendError(res, 500, "Failed to process POS checkout");
  }
}

export async function listCommissions(req: AuthRequest, res: Response) {
  const commissions = await Commission.find()
    .populate("staffPersonId", "fullName email")
    .populate("appointmentId")
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, commissions);
}

export async function downloadInvoicePdf(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId || req.user!.municipalityId;

    const invoice = await Invoice.findOne({ _id: id, tenantId }).populate("clientOrStudentPersonId");
    if (!invoice) {
      return sendError(res, 404, "Invoice not found");
    }

    // Map DB invoice to PDF template data format
    const client = invoice.clientOrStudentPersonId as any;
    const invoiceData: InvoiceData = {
      studioName: "BeautyStudio OS", // In real app, fetch from Tenant settings
      studioAddress: "123 Beauty Lane, Glamour City",
      invoiceNumber: invoice._id.toString().slice(-6).toUpperCase(),
      date: invoice.createdAt.toLocaleDateString(),
      clientName: client?.fullName || "Walk-in Client",
      clientPhone: client?.phone,
      clientEmail: client?.email,
      items: invoice.lineItems.map(item => ({
        description: item.description,
        quantity: 1,
        price: item.amount,
        total: item.amount
      })),
      subtotal: invoice.totalAmount, // Assuming no tax/discount stored yet for simplicity
      tax: 0,
      total: invoice.totalAmount,
      paymentMethod: invoice.status === 'paid' ? 'Card' : 'Pending'
    };

    const html = generateInvoiceHtml(invoiceData);
    const pdfBuffer = await generatePdfFromHtml(html);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    res.end(pdfBuffer);
  } catch (error) {
    console.error("PDF generation failed:", error);
    sendError(res, 500, "Failed to generate PDF");
  }
}


export async function markCommissionPaid(req: AuthRequest, res: Response) {
  const commission = await Commission.findByIdAndUpdate(
    req.params.id,
    { paid: true },
    { new: true }
  );

  if (!commission) return sendError(res, 404, "Commission not found");
  return sendSuccess(res, commission, "Commission marked as paid");
}
