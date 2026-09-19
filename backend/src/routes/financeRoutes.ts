import { Router } from "express";
import { 
  DepositModel, 
  VoucherModel, 
  HandLoanModel, 
  SeizedVehicleModel, 
  BadDebtModel, 
  AuctionSaleModel, 
  LoanModel, 
  AuditLogModel 
} from "@xerova/database";

const router = Router();

// 1. Deposits
router.get("/deposits", async (req, res) => {
  try {
    const list = await DepositModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ error: "Error fetching deposits" }); }
});
router.post("/deposits", async (req, res) => {
  try {
    const body = req.body;
    const item = await DepositModel.create({
      ...body,
      id: body.id || `DEP-${Date.now().toString().slice(-5)}`,
      startDate: body.startDate || new Date().toISOString().split("T")[0],
      status: "ACTIVE"
    });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: "Error creating deposit" }); }
});

// 2. Vouchers
router.get("/vouchers", async (req, res) => {
  try {
    const list = await VoucherModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ error: "Error fetching vouchers" }); }
});
router.post("/vouchers", async (req, res) => {
  try {
    const body = req.body;
    const item = await VoucherModel.create({
      ...body,
      id: body.id || `VOU-${Date.now().toString().slice(-6)}`,
      date: body.date || new Date().toISOString().split("T")[0]
    });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: "Error posting voucher" }); }
});

// 3. Hand Loans
router.get("/handloans", async (req, res) => {
  try {
    const list = await HandLoanModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ error: "Error fetching hand loans" }); }
});
router.post("/handloans", async (req, res) => {
  try {
    const body = req.body;
    const item = await HandLoanModel.create({
      ...body,
      id: body.id || `HL-${Date.now().toString().slice(-5)}`,
      givenDate: body.givenDate || new Date().toISOString().split("T")[0],
      status: "ACTIVE",
      repaidAmount: 0
    });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: "Error creating hand loan" }); }
});
router.post("/handloans/:id/pay", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const hl = await HandLoanModel.findOne({ id });
    if (!hl) return res.status(404).json({ error: "Hand loan not found" });

    hl.repaidAmount = (hl.repaidAmount || 0) + Number(amount || 0);
    if (hl.repaidAmount >= hl.amount) hl.status = "PAID";
    await hl.save();

    res.json(hl);
  } catch (err) { res.status(500).json({ error: "Error recording hand loan repayment" }); }
});

// 4. Seized Vehicles
router.get("/seized", async (req, res) => {
  try {
    const list = await SeizedVehicleModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ error: "Error fetching seized vehicles" }); }
});
router.post("/seized", async (req, res) => {
  try {
    const body = req.body;
    const item = await SeizedVehicleModel.create({
      ...body,
      id: body.id || `SZ-${Date.now().toString().slice(-5)}`,
      seizureDate: body.seizureDate || new Date().toISOString().split("T")[0],
      status: "IN_YARD"
    });

    if (body.loanNo) {
      await LoanModel.findOneAndUpdate({ loanNo: body.loanNo }, { status: "SEIZED" });
    }

    await AuditLogModel.create({
      id: "LOG-" + Date.now(),
      timestamp: new Date().toISOString(),
      user: "Recovery Officer",
      action: "VEHICLE_SEIZED",
      details: `Vehicle repossessed: ${item.vehicleName} (${item.rcNo}) from loan ${item.loanNo}. Yard: ${item.godownLocation}`
    });

    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: "Error recording vehicle seizure" }); }
});
router.post("/seized/:id/release", async (req, res) => {
  try {
    const { id } = req.params;
    const item = await SeizedVehicleModel.findOneAndUpdate(
      { id },
      { status: "RELEASED", releaseDate: new Date().toISOString().split("T")[0], releaseRemarks: req.body.remarks || "Released on settlement" },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: "Seized record not found" });
    if (item.loanNo) {
      await LoanModel.findOneAndUpdate({ loanNo: item.loanNo }, { status: "ACTIVE" });
    }
    res.json(item);
  } catch (err) { res.status(500).json({ error: "Error releasing vehicle" }); }
});
router.post("/seized/:id/auction", async (req, res) => {
  try {
    const { id } = req.params;
    const item = await SeizedVehicleModel.findOneAndUpdate(
      { id },
      { status: "AUCTIONED", auctionPrice: Number(req.body.auctionPrice || 0) },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: "Seized record not found" });

    await AuctionSaleModel.create({
      id: `AUC-${Date.now().toString().slice(-5)}`,
      seizedVehicleId: item.id,
      vehicleName: item.vehicleName,
      rcNo: item.rcNo,
      buyerName: req.body.buyerName || "Public Auction Bidder",
      buyerPhone: req.body.buyerPhone || "N/A",
      basePrice: item.valuationAmount || 0,
      finalBidAmount: Number(req.body.auctionPrice || 0),
      auctionDate: new Date().toISOString().split("T")[0],
      status: "COMPLETED"
    });

    res.json(item);
  } catch (err) { res.status(500).json({ error: "Error auctioning vehicle" }); }
});
router.post("/seized/:id/writeoff", async (req, res) => {
  try {
    const { id } = req.params;
    const item = await SeizedVehicleModel.findOneAndUpdate({ id }, { status: "WRITTEN_OFF" }, { new: true });
    if (!item) return res.status(404).json({ error: "Seized record not found" });

    if (item.loanNo) {
      const loan = await LoanModel.findOne({ loanNo: item.loanNo });
      await LoanModel.findOneAndUpdate({ loanNo: item.loanNo }, { status: "WRITTEN_OFF" });
      if (loan) {
        await BadDebtModel.create({
          id: `BD-${Date.now().toString().slice(-5)}`,
          loanNo: loan.loanNo,
          customerName: loan.customer?.name || item.customerName,
          originalLoanAmount: loan.loanAmount || 0,
          defaultedAmount: loan.pendingAmount || 0,
          writeOffDate: new Date().toISOString().split("T")[0],
          recoveryStatus: "UNRECOVERED",
          remarks: "Transferred from seized inventory write-off."
        });
      }
    }
    res.json(item);
  } catch (err) { res.status(500).json({ error: "Error writing off vehicle" }); }
});

// 5. Bad Debts
router.get("/baddebts", async (req, res) => {
  try {
    const list = await BadDebtModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ error: "Error fetching bad debts" }); }
});
router.post("/baddebts", async (req, res) => {
  try {
    const item = await BadDebtModel.create({
      ...req.body,
      id: req.body.id || `BD-${Date.now().toString().slice(-5)}`,
      writeOffDate: req.body.writeOffDate || new Date().toISOString().split("T")[0]
    });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: "Error creating bad debt record" }); }
});

// 6. Auctions
router.get("/auctions", async (req, res) => {
  try {
    const list = await AuctionSaleModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) { res.status(500).json({ error: "Error fetching auctions" }); }
});
router.post("/auctions", async (req, res) => {
  try {
    const item = await AuctionSaleModel.create({
      ...req.body,
      id: req.body.id || `AUC-${Date.now().toString().slice(-5)}`,
      auctionDate: req.body.auctionDate || new Date().toISOString().split("T")[0]
    });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: "Error recording auction sale" }); }
});

export default router;
