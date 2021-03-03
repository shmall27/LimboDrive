const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  dirName: String,

  userFiles: [
    {
      hostEmail: String,
      hostID: String,
      fileTree: [
        {
          name: String,
          children: Array,
          path: String,
          expand: {
            type: Boolean,
            default: false
          }
        }
      ]
    }
  ],
  authUsers: [String]
});

module.exports = RoomSchema;
