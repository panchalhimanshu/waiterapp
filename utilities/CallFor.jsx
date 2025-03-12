import GlobalProperties from "./GlobalPropperties";
import LocalConfig from "./environments/LocalConfig";
import TestConfig from "./environments/TestConfig";
import LiveConfig from "./environments/LiveConfig";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

const getToken = async () => {
  try {
    const tokenStr = await AsyncStorage.getItem("token");
    return tokenStr || null;  // Return the token string directly, no JSON.parse needed
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};

// Get environment config based on GlobalProperties
const getEnvironmentConfig = () => {
  switch (GlobalProperties.environment) {
    case "TEST":
      return TestConfig;
    case "LIVE":
      return LiveConfig;
    case "LOCAL":
    default:
      return LocalConfig;
  }
};

const CallFor = async (requestUrl, method, data, headerType) => {
  const config = getEnvironmentConfig();
  const baseUrl = config.getUrl(requestUrl);
  const url = baseUrl + requestUrl;

  const headers = {};

  switch (headerType) {
    case "withoutAuth":
      headers["Content-Type"] = "application/json";
      break;
    case "Auth":
      const token = await getToken();
      if (token) {
        headers["authorization"] = `Bearer ${token}`;  // Use the token directly
        headers["Content-Type"] = "application/json";
      } else {
        console.error("No token available");
      }
      break;
    case "authWithoutContentType":
      headers["authorization"] = "Bearer " + getToken();
      break;
    case "authWithContentTypeMultipart":
      headers["authorization"] = "Bearer " + getToken();
      headers["Content-Type"] = "multipart/form-data";
      break;
    default:
      break;
  }

  try {
    const response = await axios({
      url,
      method,
      headers,
      data:
        method.toUpperCase() == "POST" ||
        method.toUpperCase() == "PUT" ||
        method.toUpperCase() == "PATCH"
          ? data
          : undefined,
    });
    return response;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export default CallFor;
