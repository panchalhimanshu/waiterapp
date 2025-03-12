const LocalConfig = {
  baseHost: "http://172.16.1.57",
  // baseHost: "http://192.168.1.101",
//   defaultPort: "140",
  ports: {
    attributes : "5004",
    categories : '5004',
    "categories-import" : '5014',

    images : '5004',
    unitofmeasure :"5004",
    prowastage: "5006",
    notifications: "5010",
    // Orders Module
    // "orders/create": "140",
    // "orders/list": "140",
    // "orders/menu": "140",
    // "orders/kitchen": "140",
    // "orders/payment": "140",
    orders: "5007", // default for orders
    tables: "5005",
    queue: "5005",
    bookings: "5005",
    floors:"5005",



    
    // User Module
    // "users/list": "144",
    // "users/create": "144",
    // "users/profile": "144",
    users: "5001", // default for users

    // Auth Module
    // "auth/login": "145",
    // "auth/register": "145",
    // "auth/forgot-password": "145",
    auth: "5001", // default for auth

    // Products Module
    // "products/list": "146",
    // "products/create": "146",
    products: "5006", // default for products
  },
    getUrl: function (path) {
      // return `${this.baseHost}:5000/api/v2/`; 
      const port = this.ports[path] || this.ports[path.split("/")[0]];
      
    return port
      ? `${this.baseHost}:${port}/api/v2/`
      : `${this.baseHost}:140/api/v2/`;
  },
};

export default LocalConfig;
