const curl2vRO = require('./curl2vRO');

// Example curl command
const curlCommand = `curl -O www.haxx.se/index.html -O curl.se/download.html`;

// Convert to vRO code
const vroCode = curl2vRO.convertCurlToVRO(curlCommand);
console.log(vroCode);