module.exports = (io) => {
  // Import event files
  require("./userConnected")(io);
  require("./updateRoom")(io);
};
