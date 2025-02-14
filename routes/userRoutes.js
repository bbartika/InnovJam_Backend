const express = require("express");
const router = express.Router();
const { createUsers, getUsersByRole, updateUser, removeUser, getAllUsers, createUser  , getUserDetailsById} = require("../controllers/userController");
const validateObjectIdMiddleware = require('../middleware/mongoIdVerification')

router.post("/create", createUser);
router.post("/create-users", createUsers);
router.get("/getuser/:role", getUsersByRole);
router.get("/getuserdetails/:id", getUserDetailsById);
router.put("/update/:id", validateObjectIdMiddleware, updateUser);
router.delete("/remove/:id", validateObjectIdMiddleware, removeUser);
router.get("/getusers", getAllUsers);

module.exports = router;
