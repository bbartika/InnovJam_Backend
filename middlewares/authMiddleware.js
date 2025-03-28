const jwt = require("jsonwebtoken");
const User = require("../Model/UserModel");

const authMiddleware = async (req, res, next) => {
    const token = req?.headers?.authorization?.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
}

module.exports = authMiddleware;