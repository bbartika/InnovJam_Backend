const express = require("express");
const router = express.Router();
const { createUsers, getUsersByRole, updateUser, removeUser, getAllUsersByRole, createUser } = require("../controllers/userController");
const validateObjectIdMiddleware = require('../middleware/mongoIdVerification')

router.post("/create", createUser);
router.post("/create-users", createUsers);
router.get("/:role", getUsersByRole);
router.put("/:id", validateObjectIdMiddleware, updateUser);
router.delete("/:id", validateObjectIdMiddleware, removeUser);
router.get("/all/:role", getAllUsersByRole);

module.exports = router;
