// const LiveConfig = {
//   baseHost: import.meta.env.VITE_BASE_HOST,
//   ports: {
//        attributes : "setting",
//         categories : 'setting',
//         "categories-import" : 'bulk',
//         dashboard: "setting",
//         images : 'setting',
//         "payments" : 'setting',
//         "payment-gateway-keys" : 'setting',
//         unitofmeasure :"setting",
//         notifications: "notification",
//         // Orders Module
//         orders: "order", // default for orders
//         tables: "table",
//         queue: "table",
//         bookings: "table",
//         floors:"table",
//         "payments" : 'setting',
//         "payment-gateway-keys" : 'setting',
//         // User Module
//         users: "users", // default for users
//         organization:"organization",
//         // Auth Module
//         auth: "users", // default for auth
//         // Products Module
//         products: "product", // default for products
//         prowastage:"product",
//         "product-locations":"product",
//          "stock-transfers":"product",
//         "stock-conversion":"product",
//         "variant-location":"product",
//         psverification:"product",
//         "stock-transactions": "product",
//   },
//     getUrl: function (path) {
//       const port = this.ports[path] || this.ports[path.split("/")[0]];
     
//     return port
//       ? `${this.baseHost}/${port}/api/v2/`
//       : `${this.baseHost}/setting/api/v2/`;
//   },
// };
 
// export default LiveConfig;











const LiveConfig = {
  baseHost: "https://tgg-api.jalpaan.ai",
  // baseHost: "http://192.168.1.101",
//   defaultPort: "140",
  ports: {
    forms:"setting",
    attributes : "setting",
    categories : 'setting',
    "products-import":"bulk",
    "attributes-import":"bulk",
    "categories-import" : 'bulk',
    dashboard: "setting",
    images : 'setting',
    "payments" : 'setting',
    "payment-gateway-keys" : 'setting',
    unitofmeasure :"setting",
    notifications: "notification",
    // Orders Module
    // "orders/create": "140",
    // "orders/list": "140",
    // "orders/menu": "140",
    // "orders/kitchen": "140",
    // "orders/payment": "140",
    orders: "order", // default for orders
    "bank-payments": "order",
    tables: "table",
    queue: "table",
    bookings: "table",
    floors:"table",
    "globalSettings":"setting",
   
    // User Module
    // "users/list": "144",
    // "users/create": "144",
    // "users/profile": "144",
    users: "users", // default for users
    organization:"organization",
    // Auth Module
    // "auth/login": "145",
    // "auth/register": "145",
    // "auth/forgot-password": "145",
    auth: "users", // default for auth
 
    // Products Module
    // "products/list": "146",
    // "products/create": "146",
    products: "product", // default for products
    "publicProducts":"product",
    prowastage:"product",
    "product-locations":"product",
     "stock-transfers":"product",
    "stock-conversion":"product",
    "variant-location":"product",
    psverification:"product",
    "stock-transactions": "product",
    "bom-schedule":"product",
    "publicCategories":"setting"
  },
    getUrl: function (path) {
      // return `${this.baseHost}:5000/api/v2/`;
      const port = this.ports[path] || this.ports[path.split("/")[0]];
     
    return port
      ? `${this.baseHost}/${port}/api/v2/`
      : `${this.baseHost}:140/api/v2/`;
  },
};
 
export default LiveConfig;





