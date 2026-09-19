import { Router } from "express";
import { PreLoanModel, LoanModel, CustomerModel, AuditLogModel } from "@xerova/database";
import { generateInstallments } from "./loanRoutes.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const list = await PreLoanModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Error fetching pre-loan proposals" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const applicantName = body.applicantName || body.name || "Applicant";
    const phone = body.phone || body.housePhone || "N/A";
    const vehicleModel = body.vehicleModel || body.vehicleName || body.model || "Vehicle";
    const requestedAmount = Number(body.requestedAmount || body.requiredLoan || 0);
    const id = body.id || body.serialNo || `PRE-${Date.now().toString().slice(-5)}`;

    const item = await PreLoanModel.create({
      ...body,
      id,
      serialNo: id,
      applicantName,
      name: applicantName,
      phone,
      vehicleModel,
      vehicleName: vehicleModel,
      requestedAmount,
      requiredLoan: requestedAmount,
      date: body.date || new Date().toISOString().split("T")[0],
      status: body.status || "PENDING"
    });

    await AuditLogModel.create({
      id: "LOG-" + Date.now(),
      timestamp: new Date().toISOString(),
      user: "Underwriting Desk",
      action: "PRELOAN_SUBMITTED",
      details: `New Pre-loan proposal filed: ${item.id} for ${applicantName} (₹${requestedAmount.toLocaleString()})`
    });

    res.status(201).json(item);
  } catch (err) {
    console.error("[PreLoan] Error creating proposal:", err);
    res.status(500).json({ error: "Error submitting pre-loan proposal" });
  }
});

router.post("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, verificationNotes, assignedExecutive } = req.body;
    const updated = await PreLoanModel.findOneAndUpdate(
      { $or: [{ id }, { serialNo: id }] },
      { $set: { status, ...(verificationNotes && { verificationNotes }), ...(assignedExecutive && { assignedExecutive }) } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Proposal not found" });

    // Auto-create active HP Loan & Customer when proposal is APPROVED
    if (status === "APPROVED") {
      try {
        const custId = `CUST-${Date.now().toString().slice(-4)}`;
        const loanNo = `HP-${updated.serialNo ? updated.serialNo.replace("PRE-", "") : Date.now().toString().slice(-4)}`;
        
        // Save to Customer DB if not existing
        const applicantName = updated.applicantName || updated.name || "Customer";
        const phone = updated.phone || "N/A";

        let customer = await CustomerModel.findOne({ phone });
        if (!customer) {
          customer = await CustomerModel.create({
            id: custId,
            name: applicantName,
            phone,
            address: updated.address || updated.area || "N/A",
            guarantors: updated.coObligantName ? [{ name: updated.coObligantName, phone }] : []
          });
        }

        const loanAmount = Number(updated.requestedAmount || updated.requiredLoan || 60000);
        const durationMonths = 24;
        const interestRate = 16.5;
        const emiAmount = Math.round((loanAmount * (1 + (interestRate / 100) * (durationMonths / 12))) / durationMonths);
        const totalDueAmount = emiAmount * durationMonths;

        // Save to Loan DB
        const existingLoan = await LoanModel.findOne({ loanNo });
        if (!existingLoan) {
          await LoanModel.create({
            loanNo,
            borrowerId: customer.id,
            customer: {
              id: customer.id,
              name: applicantName,
              phone,
              address: updated.address,
              area: updated.area
            },
            vehicle: {
              vehicleName: updated.vehicleModel || updated.vehicleName || updated.model || "Two Wheeler",
              rcNo: updated.rcNo || "TN-PENDING",
              engineNo: updated.engineNo || "ENG-PENDING",
              chassisNo: updated.chassisNo || "CHS-PENDING",
              modelYear: updated.model || "2025"
            },
            loanAmount,
            interestRate,
            durationMonths,
            emiAmount,
            totalDueAmount,
            totalPaidAmount: 0,
            pendingAmount: totalDueAmount,
            disbursementDate: new Date().toISOString().split("T")[0],
            hpDate: new Date().toISOString().split("T")[0],
            status: "ACTIVE",
            installments: generateInstallments(loanAmount, interestRate, durationMonths, emiAmount, new Date().toISOString().split("T")[0]),
            payments: []
          });
        }
      } catch (autoErr) {
        console.error("Auto-conversion to HP Loan error:", autoErr);
      }
    }

    await AuditLogModel.create({
      id: "LOG-" + Date.now(),
      timestamp: new Date().toISOString(),
      user: "Senior Underwriter",
      action: "PRELOAN_STATUS_UPDATE",
      details: `Proposal ${id} (${updated.applicantName || updated.name}) updated to status: ${status}`
    });

    res.json(updated);
  } catch (err) {
    console.error("[PreLoan] Status update error:", err);
    res.status(500).json({ error: "Error updating proposal status" });
  }
});

router.post("/:id/fraud-flag", async (req, res) => {
  try {
    const { id } = req.params;
    const { aiFraudFlag, aiFraudReasons } = req.body;
    const updated = await PreLoanModel.findOneAndUpdate(
      { $or: [{ id }, { serialNo: id }] },
      { $set: { aiFraudFlag, aiFraudReasons } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Proposal not found" });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error toggling fraud flag" });
  }
});

export default router;

