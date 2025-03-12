const LiveConfig = {
  baseHost: "https://admin.zyapaar.com",
  ports: {
    // Production usually doesn't need ports, but you can add if needed
    orders: "",
    users: "",
    auth: "",
    products: "",
  },
  getUrl: function (path) {
    return `${this.baseHost}/api/`;
  },
};

export default LiveConfig;
