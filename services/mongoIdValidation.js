const mongoose = require('mongoose');

/* -------------------------------------------------------------------------- */
/*                           MONGODB ID VERIFICATION                          */
/* -------------------------------------------------------------------------- */

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

module.exports = isValidObjectId;