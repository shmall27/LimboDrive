const mongoose = require("mongoose")

const roomSchema = new mongoose.Schema({
    name: { type: String },
    children: { type: Array },
    key: { type: String }
})

module.exports = mongoose.model("DBRooms", roomSchema)