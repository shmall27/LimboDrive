const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  dirName: String,
  fileTree: [
    {
      name: String,
      children: Array,
      key: String,
      expand: {
        type: Boolean,
        default: false
      }
    }
  ],
  authUsers: [String]
});

module.exports = RoomSchema;
