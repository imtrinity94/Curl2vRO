/**
 * @description Curl to vRO JavaScritpt converted code
 * @author curl2vRO
 * @version 1.0.0
 * @date 2025-05-04
 */

// Accept SSL certificate
var ld = Config.getKeystores().getImportCAFromUrlAction();
var model = ld.getModel();
model.value = "https://api.sampleapis.com/coffee/hot";
var error = ld.execute();
if (error) {
    throw new Error("Failed to accept certificate for URL: " + "https://api.sampleapis.com/coffee/hot" + ". Error: " + error);
}

// Create transient REST host
var restHost = RESTHostManager.createHost("dynamicRequest");
var httpRestHost = RESTHostManager.createTransientHostFrom(restHost);
httpRestHost.operationTimeout = 600;
httpRestHost.url = "https://api.sampleapis.com";

// Create REST request
var request = httpRestHost.createRequest("GET", "/coffee/hot", null);

// Execute REST request
var response = request.execute();

// Handle response
if (response.statusCode == 200) {
    System.log("Request successful");
    var responseContent = JSON.parse(response.contentAsString);
    System.log(JSON.stringify(responseContent));
} else {
    throw "Request failed with status: " + response.statusCode;
}

/*
Original curl command:
curl -X GET https://api.sampleapis.com/coffee/hot
*/