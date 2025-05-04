const curl2vRO = require('curl2vRO');

// Your curl command
const curlCommand = `curl https://api.example.com/data`;

// Convert to vRO code
const vroCode = curl2vRO.convertCurlToVRO(curlCommand);
console.log(vroCode);
