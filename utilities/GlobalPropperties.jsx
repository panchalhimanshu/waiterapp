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
  localUrlParam: "https://tgg-api.jalpaan.ai/api",
  // testParam: 'https://sms-api.ezeo.app/api/',
  // viewdocument: 'http://192.168.1.87:5000',
  // viewdocument: 'http://192.168.1.153:5009',
  viewdocument: "https://tgg-api.jalpaan.ai",
  // viewdocument: 'http://localhost:5000',
  // ezeo_shopmystation:"https://staging.shopmystation.com/",
  ezeo_sms_live: "",
  environment: UrlType.LIVE,
};
export default GlobalPropperties;
