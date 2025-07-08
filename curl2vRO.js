/**
 * @module Curl2vRO
 * @requires fs
 * @requires curl-to-postmanv2
 * @requires deasync
 * @fileoverview Curl to vRO JavaScript Code Converter
 * @description A utility to convert curl commands to VMware vRealize Orchestrator (vRO) JavaScript code
 * @author Mayank Goyal <mayankgoyalmax@gmail.com>
 * @version 2.0.2
 * @license MIT
 */

const { validate, convert } = require('curl-to-postmanv2');
const fs = require('fs');
const deasync = require('deasync');

// Create a synchronous version of the convert function
function convertSync(curlCommand) {
    let done = false;
    let result = null;
    let error = null;
    
    convert({ type: 'string', data: curlCommand }, (err, res) => {
        if (err) {
            error = err;
        } else {
            result = res;
        }
        done = true;
    });
    
    // Wait synchronously for the async operation to complete
    deasync.loopWhile(() => !done);
    
    if (error) throw error;
    return result;
}

/**
 * Converts a Postman request object to vRO JavaScript code
 * @param {Object} postmanRequest - The Postman request object
 * @param {string} originalCurl - The original curl command for reference
 * @returns {string} The generated vRO JavaScript code
 */
function generateVROCode(postmanRequest, originalCurl) {
    if (!postmanRequest || !postmanRequest.url) {
        throw new Error('Invalid Postman request object');
    }

    const method = postmanRequest.method || 'GET';
    const url = typeof postmanRequest.url === 'string' 
        ? postmanRequest.url 
        : (postmanRequest.url.raw || '');

    if (!url) {
        throw new Error('No URL found in the request');
    }
    
    // Check for FTP protocol
    if (url.toLowerCase().startsWith('ftp://')) {
        throw new Error('FTP protocol is not supported. Please use HTTP or HTTPS.');
    }

    // Parse URL to extract components
    let urlObj;
    let urlToProcess = url;
    
    // Add https:// if no protocol (http:// or https://) is specified
    if (!/^https?:\/\//i.test(urlToProcess)) {
        urlToProcess = 'https://' + urlToProcess;
    }
    
    try {
        urlObj = new URL(urlToProcess);
    } catch (e) {
        throw new Error(`Invalid URL format: ${url}`);
    }

    // Get current date for JSDoc
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Start building the vRO code
    let vroCode = `/**
 * @description Makes a ${method} REST call to ${url}
 * @author curl2vRO (Mayank Goyal)
 */

// Define URL components
var targetUrl = "${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${urlObj.search || ''}";
var baseUrl = "${urlObj.protocol}//${urlObj.host}";

// Accept SSL certificate
var ld = Config.getKeystores().getImportCAFromUrlAction();
var model = ld.getModel();
model.value = baseUrl;
var error = ld.execute();
if (error) {
    throw new Error("Failed to accept certificate for URL: " + baseUrl + ". Error: " + error);
}

// Create transient REST host
var restHost = RESTHostManager.createHost("dynamicRequest");
var httpRestHost = RESTHostManager.createTransientHostFrom(restHost);
httpRestHost.operationTimeout = 600;
httpRestHost.url = baseUrl;

// Create REST request
var request = httpRestHost.createRequest("${method.toUpperCase()}", "${urlObj.pathname}${urlObj.search || ''}");
`;

    // Add headers
    const headers = postmanRequest.header || [];
    if (headers.length > 0) {
        vroCode += '\n// Add headers\n';
        headers.forEach(h => {
            if (h.key && h.value) {
                // Skip Content-Length as it's handled automatically
                if (h.key.toLowerCase() !== 'content-length') {
                    const escapedValue = h.value.replace(/"/g, '\\"');
                    vroCode += `request.setHeader("${h.key}", "${escapedValue}");\n`;
                }
            }
        });
    }

    // Helper function to check if string is JSON
    function isJsonString(str) {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Add request body if present
    if (postmanRequest.body) {
        if (postmanRequest.body.mode === 'raw' && postmanRequest.body.raw) {
            // Get content type from headers
            const contentTypeHeader = headers.find(h => h.key.toLowerCase() === 'content-type');
            const contentType = contentTypeHeader ? contentTypeHeader.value.toLowerCase() : '';
            const body = postmanRequest.body.raw;
            
            // Handle different content types
            if (contentType.includes('application/json') || isJsonString(body)) {
                // Handle JSON content
                const jsonBody = JSON.parse(body);
                vroCode += '\n// Set JSON request body\nrequest.contentType = "application/json";\n';
                vroCode += `request.content = JSON.stringify(${JSON.stringify(jsonBody, null, 2)});\n`;
            } else if (contentType.includes('application/xml') || contentType.includes('text/xml') || 
                      (contentType === '' && body.trim().startsWith('<'))) {
                // Handle XML content
                const xmlContent = body.replace(/`/g, '\\`'); // Escape backticks in XML
                vroCode += `\n// Set XML request body\nrequest.contentType = "${contentType || 'application/xml'}";\n`;
                vroCode += `request.content = \`${xmlContent}\`;\n`;
            } else if (contentType === '*/*' || !contentType) {
                // Handle wildcard or no content type
                if (body.trim().startsWith('<')) {
                    // Looks like XML
                    const xmlContent = body.replace(/`/g, '\\`');
                    vroCode += '\n// Set request body (inferred XML)\nrequest.contentType = "application/xml";\n';
                    vroCode += `request.content = \`${xmlContent}\`;\n`;
                } else if (isJsonString(body)) {
                    // Try parsing as JSON
                    const jsonBody = JSON.parse(body);
                    vroCode += '\n// Set request body (inferred JSON)\nrequest.contentType = "application/json";\n';
                    vroCode += `request.content = JSON.stringify(${JSON.stringify(jsonBody, null, 2)});\n`;
                } else {
                    // Default to text/plain
                    const textContent = body.replace(/`/g, '\\`');
                    vroCode += '\n// Set request body (default text)\nrequest.contentType = "text/plain";\n';
                    vroCode += `request.content = \`${textContent}\`;\n`;
                }
            } else {
                // Handle other content types as-is
                const escapedContent = body.replace(/`/g, '\\`');
                vroCode += `\n// Set ${contentType} request body\nrequest.contentType = "${contentType}";\n`;
                vroCode += `request.content = \`${escapedContent}\`;\n`;
            }
        } else if (postmanRequest.body.mode === 'formdata' && postmanRequest.body.formdata) {
            // Handle form data
            vroCode += '\n// Set form data\n';
            postmanRequest.body.formdata.forEach(item => {
                if (item.key) {
                    const value = item.value || '';
                    vroCode += `request.addParameter("${item.key}", "${value}");\n`;
                }
            });
        } else if (postmanRequest.body.mode === 'urlencoded' && postmanRequest.body.urlencoded) {
            // Handle URL encoded form data
            vroCode += '\n// Set URL encoded form data\n';
            postmanRequest.body.urlencoded.forEach(item => {
                if (item.key) {
                    const value = item.value || '';
                    vroCode += `request.addParameter("${item.key}", "${value}");\n`;
                }
            });
        }
    }

    // Add execution code
    vroCode += `
// Execute REST request
var response = request.execute();

// Handle response
if (response.statusCode >= 200 && response.statusCode < 300) {
    System.log("Request successful");
    try {
        // Try to parse JSON response
        var responseContent = JSON.parse(response.contentAsString);
        System.log(JSON.stringify(responseContent, null, 2));
        return responseContent;
    } catch (e) {
        // If not JSON, return as text
        System.log(response.contentAsString);
        return response.contentAsString;
    }
} else {
    var errorMessage = "Request failed with status: " + response.statusCode;
    try {
        // Try to include error details from response
        var errorContent = JSON.parse(response.contentAsString);
        errorMessage += " - " + (errorContent.message || errorContent.error || JSON.stringify(errorContent));
    } catch (e) {
        errorMessage += " - " + response.contentAsString;
    }
    throw errorMessage;
}
`;

    // Add the original curl command as a comment
    vroCode += `\n/*\nOriginal curl command:\n${originalCurl}\n*/`;

    return vroCode;
}

/**
 * Converts a curl command to vRO JavaScript code
 * @param {string} curlCommand - The curl command to convert
 * @param {Object} [options] - Conversion options
 * @param {boolean} [options.writeToFile=false] - Whether to write the output to a file. Defaults to false for safety in read-only environments.
 * @returns {string} The generated vRO JavaScript code
 * @throws {Error} If the curl command cannot be parsed properly
 */
function convertCurlToVRO(curlCommand, { writeToFile = false } = {}) {
    try {
        // First validate the curl command
        const validation = validate(curlCommand);
        if (!validation.result) {
            throw new Error(`Invalid curl command: ${validation.reason || 'Unknown error'}`);
        }

        // Convert the curl command to Postman format synchronously
        const result = convertSync(curlCommand);
        
        if (!result || !result.result || !result.output || !result.output[0]) {
            throw new Error('Failed to convert curl command: Invalid response from converter');
        }

        const postmanRequest = result.output[0].data;
        
        // Generate vRO code from the Postman request
        const vroCode = generateVROCode(postmanRequest, curlCommand);
        
        // Generate a filename from the URL and method
        const urlParts = postmanRequest.url;
        let host, path;
        
        if (typeof urlParts === 'string') {
            // For string URLs, ensure we have a protocol before creating URL object
            const urlStr = urlParts.startsWith('http') ? urlParts : 'https://' + urlParts;
            const urlObj = new URL(urlStr);
            host = urlObj.hostname;
            path = urlObj.pathname.replace(/[^a-zA-Z0-9]/g, '_');
        } else {
            host = urlParts.host ? urlParts.host.join('.') : 'request';
            path = urlParts.path ? urlParts.path.join('_') : '';
        }
            
        const filename = `${host}_${path}_${postmanRequest.method || 'get'}.js`
            .replace(/_{2,}/g, '_')
            .replace(/^_|_$/g, '');
        
        // Write to file if enabled
        if (writeToFile) {
            try {
                fs.writeFileSync(filename, vroCode);
                console.log(`vRO code has been saved to ${filename}`);
            } catch (error) {
                console.warn(`Warning: Could not write to file '${filename}': ${error.message}. The code will still be returned.`);
            }
        }
        
        return vroCode;
    } catch (error) {
        const errorMessage = `Failed to process curl command.\n` +
            `This might be due to an unsupported curl command format. Please try the following steps:\n` +
            `1. First convert your curl command using Postman's import feature:\n` +
            `   https://learning.postman.com/docs/getting-started/importing-and-exporting/importing-curl-commands/\n` +
            `2. Copy the simplified curl command from Postman and try again.\n\n` +
            `Common issues with the current command:\n` +
            `- Missing 'https://' or 'http://' prefix in URL\n` +
            `- Complex quoting or escaping in the command\n` +
            `- Unsupported curl options or parameters\n\n` +
            `Original error: ${error.message}`;
        
        throw new Error(errorMessage);
    }
}

// For backward compatibility
const convertCurlToVROAsync = (curlCommand, options) => {
    return convertCurlToVRO(curlCommand, { ...options, writeToFile: false });
};

// Export the module
module.exports = {
    convertCurlToVRO,
    convertCurlToVROAsync
};
