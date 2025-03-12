const UrlType = {
  TEST: "TEST",
  LIVE: "LIVE",
  LOCAL: "LOCAL",
};

// console.log(first)

const GlobalPropperties = {
  // urlParam: 'https://admin.zyapaar.com/',
  // localUrlParam: 'http://localhost:5000/api/',
  // localUrlParam: 'http://192.168.1.87:5000/api/',
  // localUrlParam: 'http://192.168.1.153:5009/api/',
  localUrlParam: "http://192.168.1.135:5000/api/",
  // testParam: 'https://sms-api.ezeo.app/api/',
  // viewdocument: 'http://192.168.1.87:5000',
  // viewdocument: 'http://192.168.1.153:5009',
  viewdocument: "http://172.16.1.57",
  // viewdocument: 'http://localhost:5000',
  // ezeo_shopmystation:"https://staging.shopmystation.com/",
  ezeo_sms_live: "",
  environment: UrlType.LOCAL,
};
export default GlobalPropperties;
