const TestConfig = {
  baseHost: "https://test.ezeo.app",
  ports: {
    // Test environment might use different subdomains instead of ports
    orders: "8080",
    users: "8081",
    auth: "8082",
    products: "8083",
  },
  getUrl: function (path) {
    const service = path.split("/")[0];
    return `${this.baseHost}/api/`;
  },
};

export default TestConfig;
