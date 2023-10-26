const express = require("express");
const {
  createAuditTrail,
  getAuditTrails,
  getAuditTrail,
  updateAuditTrail,
  deleteAuditTrail,
} = require("../controllers/AuditTrail");
const AuditTrail = require("../models/AuditTrail");
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

const router = express.Router();

router.route("/").post(createAuditTrail);
router.route("/").get(advancedResults(AuditTrail), getAuditTrails);
router.route("/:id").get(getAuditTrail);
router.route("/:id").patch(updateAuditTrail);
router.route("/:id").delete(protect, authorize("SuperAdmin"), deleteAuditTrail);

module.exports = router;
