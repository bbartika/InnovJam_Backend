const mongoose = require('mongoose');

/* -------------------------------------------------------------------------- */
/*                           MONGODB ID VERIFICATION MIDDLEWARE              */
/* -------------------------------------------------------------------------- */

const validateObjectIdMiddleware = (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ObjectId' });
    }

    next();
};

module.exports = validateObjectIdMiddleware;
