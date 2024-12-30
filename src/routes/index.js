const router = require("express").Router();
const appRoute = require("./api/index");

// APP router
router.use("/api", appRoute);

module.exports = router;
