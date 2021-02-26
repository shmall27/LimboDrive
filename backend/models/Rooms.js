const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  dirName: String,

  userFiles: [
    {
      hostEmail: String,
      fileTree: [
        {
          name: String,
          children: Array,
          expand: {
            type: Boolean,
            default: false
          },
          path: String
        }
      ]
    }
  ],
  authUsers: [String]
});

module.exports = RoomSchema;
