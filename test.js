const { convertCurlToVRO } = require('./curl2vRO');

// Your curl command with template variables
const curlCommand = `curl --location --request POST \
  https://vra.lab/iaas/api/network-ip-ranges/ip_range_id/ip-addresses/allocate?apiVersion=$api_version \
  -H "Authorization: Bearer $access_token" \
  -H 'Content-Type: application/json' \
  -d '{
     "description":"Automated IP Allocation",
     "numberOfIps": "1"
}'`;

try {
    // Convert to vRO code synchronously
    const options = { writeToFile: false };
    const vroCode = convertCurlToVRO(curlCommand, options);
    console.log('Successfully generated vRO code!');
    console.log(vroCode);
    if (options.writeToFile) {
        console.log('The code has been saved to a file (see console output for filename)');
    }
    
} catch (error) {
    console.error('Error:', error.message);
}
