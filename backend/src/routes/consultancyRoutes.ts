import { Router } from "express";
import { ConsultancyModel, AuditLogModel } from "@xerova/database";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const list = await ConsultancyModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Error fetching consultancy records" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const id = body.id || body.serialNo || `CON-${Date.now().toString().slice(-5)}`;
    const sellerName = body.sellerName || body.name || "Seller";
    const purchasePrice = Number(body.purchasePrice || body.vehicleValue || 0);
    const marketValuation = Number(body.marketValuation || body.vehicleValue || 0);
    const type = body.type || "PURCHASE";

    const item = await ConsultancyModel.create({
      ...body,
      id,
      serialNo: id,
      type,
      sellerName,
      name: sellerName,
      purchasePrice,
      marketValuation,
      vehicleValue: purchasePrice,
      date: body.date || new Date().toISOString().split("T")[0],
      status: body.status || (type === "SALE" ? "FOR_SALE" : "OPEN"),
      commissionEarned: Number(body.commissionEarned) || 0
    });

    await AuditLogModel.create({
      id: "LOG-" + Date.now(),
      timestamp: new Date().toISOString(),
      user: "Consultancy Desk",
      action: "PRELOAN_SUBMITTED",
      details: `${type === "SALE" ? "Vehicle Sales Stock Registered" : "Vehicle Procurement Entry Recorded"}: ${item.vehicleName} (${item.vehicleNo}) from seller ${sellerName} (₹${purchasePrice.toLocaleString()})`
    });

    res.status(201).json(item);
  } catch (err) {
    console.error("[Consultancy] Error creating stock record:", err);
    res.status(500).json({ error: "Error registering vehicle stock" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const oldDoc = await ConsultancyModel.findOne({ $or: [{ id }, { serialNo: id }] });
    const oldStatus = oldDoc?.status;

    const updated = await ConsultancyModel.findOneAndUpdate(
      { $or: [{ id }, { serialNo: id }] },
      { $set: req.body },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Consultancy record not found" });

    if (req.body.status === "SOLD" && oldStatus !== "SOLD") {
      await AuditLogModel.create({
        id: "LOG-" + Date.now(),
        timestamp: new Date().toISOString(),
        user: req.body.buyerName || "Sales Officer",
        action: "COLLECTION_RECEIPT_POSTED",
        details: `Pre-owned Vehicle Sale Completed: ${updated.vehicleName} (${updated.vehicleNo}) bought by ${req.body.buyerName} for ₹${Number(req.body.soldPrice || 0).toLocaleString()}`
      });
    } else {
      await AuditLogModel.create({
        id: "LOG-" + Date.now(),
        timestamp: new Date().toISOString(),
        user: "Consultancy Desk",
        action: "PRELOAN_STATUS_UPDATE",
        details: `Consultancy Record Updated: ${updated.vehicleName} (${updated.vehicleNo}) - Status: ${updated.status}`
      });
    }

    res.json(updated);
  } catch (err) {
    console.error("[Consultancy] Error updating record:", err);
    res.status(500).json({ error: "Error updating consultancy record" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ConsultancyModel.findOneAndDelete({ $or: [{ id }, { serialNo: id }] });
    if (!deleted) return res.status(404).json({ error: "Consultancy record not found" });

    await AuditLogModel.create({
      id: "LOG-" + Date.now(),
      timestamp: new Date().toISOString(),
      user: "Consultancy Desk",
      action: "PRELOAN_STATUS_UPDATE",
      details: `Vehicle Stock Record Removed: ${deleted.vehicleName} (${deleted.vehicleNo})`
    });

    res.json({ message: "Record deleted", deleted });
  } catch (err) {
    console.error("[Consultancy] Error deleting record:", err);
    res.status(500).json({ error: "Error deleting consultancy record" });
  }
});

export default router;

