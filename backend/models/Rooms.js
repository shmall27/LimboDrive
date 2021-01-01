const mongoose = require("mongoose")

const roomSchema = new mongoose.Schema({
    name: { type: String },
    children: { type: Array },
    key: { type: String },
    expand: { 
            type: Boolean,
            default: false
        }
})

module.exports = mongoose.model("DBRooms", roomSchema)