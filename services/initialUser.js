const User = require('../Model/UserModel');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const initialUser = async (res, req) => {
    try {
        const email = process.env.S_ADMIN_EMAIL;
        const password = process.env.S_ADMIN_PASS;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("User  already exists")
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: 'Super Admin',
            email: email,
            password: hashedPassword,
            password_org: hashedPassword,
            role: "super_admin",
            course_code: []
        });

        await newUser.save();

        console.log("User created successfully")
    } catch (error) {
        console.error(error);
    }
};

module.exports = initialUser;