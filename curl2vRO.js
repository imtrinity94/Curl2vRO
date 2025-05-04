/**
 * @module Curl2vRO
 * @requires fs
 * @fileoverview Curl to vRO REST API Converter
 * @description A utility to convert curl commands to VMware vRealize Orchestrator (vRO) JavaScript code
 * @author Mayank Goyal <mayankgoyalmax@gmail.com>
 * @version 1.0.5
 * @license MIT
 * @website https://cloudblogger.co.in
 */

/**
 * Parses a curl command and extracts its components
 * @param {string} curlCommand - The curl command to parse
 * @returns {Object} An object containing the parsed components (url, method, headers, data)
 */
function parseCurlCommand(curlCommand) {
    // Enhanced URL regex to handle various curl command formats
    const urlRegex = /curl\s+(?:(?:-X\s+\w+\s+)|(?:--request\s+\w+\s+)|(?:--location\s+)|(?:-L\s+)|(?:--url\s+))?['"]?((?:https?|http):\/\/[^'""\s]+)['"]?/;
    const urlMatch = curlCommand.match(urlRegex);
    
    // Method detection - support both -X and --request formats
    const methodMatch = curlCommand.match(/(?:-X|--request)\s+([A-Z]+)/i);
    
    // Header detection - support -H, --header, and variations with single/double quotes
    const headerMatches = curlCommand.match(/(?:-H|--header)\s+(['"])([^\1]+?)\1/g) || 
                          curlCommand.match(/(?:-H|--header)\s+([^'\s"][^\s]*)/g);
    
    // Data detection - support multiple formats:
    // -d, --data, --data-raw, --data-binary, --data-urlencode with quotes or without
    const dataRegexes = [
        /-d\s+(['"])({[\s\S]*?})\1/,                  // -d '{"json":"data"}'
        /--data\s+(['"])({[\s\S]*?})\1/,              // --data '{"json":"data"}'
        /--data-raw\s+(['"])({[\s\S]*?})\1/,          // --data-raw '{"json":"data"}'
        /--data-binary\s+(['"])({[\s\S]*?})\1/,       // --data-binary '{"json":"data"}'
        /-d\s+(['"])([\s\S]*?)\1/,                    // -d 'any data'
        /--data\s+(['"])([\s\S]*?)\1/,                // --data 'any data'
        /--data-raw\s+(['"])([\s\S]*?)\1/,            // --data-raw 'any data'
        /--data-binary\s+(['"])([\s\S]*?)\1/,         // --data-binary 'any data'
        /--data-urlencode\s+(['"])([\s\S]*?)\1/       // --data-urlencode 'name=value'
    ];
    
    let dataMatch = null;
    for (const regex of dataRegexes) {
        const match = curlCommand.match(regex);
        if (match) {
            dataMatch = match;
            break;
        }
    }

    // Extract components
    const url = urlMatch ? (urlMatch[1] || urlMatch[2]) : '';
    let method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';
    const headers = {};
    let data = null;
    
    // If there's request data but no explicit method, assume POST
    if (dataMatch) {
        data = dataMatch[2];
        if (!methodMatch) {
            method = 'POST';
        }
    }

    // Parse headers
    if (headerMatches) {
        headerMatches.forEach(header => {
            // Extract header content from quotes if present
            let headerContent;
            const quotedMatch = header.match(/(?:-H|--header)\s+(['"])([^\1]+?)\1/);
            if (quotedMatch) {
                headerContent = quotedMatch[2];
            } else {
                const unquotedMatch = header.match(/(?:-H|--header)\s+([^'\s"][^\s]*)/);
                headerContent = unquotedMatch ? unquotedMatch[1] : '';
            }
            
            // Split into key-value if we have a valid header
            if (headerContent && headerContent.includes(':')) {
                const [key, ...valueParts] = headerContent.split(':');
                const value = valueParts.join(':').trim(); // Rejoin in case value contains colons
                headers[key.trim()] = value;
            }
        });
    }

    // Handle authentication with -u or --user
    const authMatch = curlCommand.match(/(?:-u|--user)\s+(['"]?)([^'"]+?)\1/);
    if (authMatch && authMatch[2].includes(':')) {
        const [username, password] = authMatch[2].split(':');
        headers['Authorization'] = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
    }

    // Handle form data with --form or -F
    const formMatches = curlCommand.match(/(?:--form|-F)\s+(['"]?)([^'"]+?)\1/g);
    if (formMatches && !dataMatch) {
        const formData = {};
        formMatches.forEach(formPart => {
            const match = formPart.match(/(?:--form|-F)\s+(['"]?)([^'"]+?)\1/);
            if (match && match[2].includes('=')) {
                const [key, value] = match[2].split('=');
                formData[key.trim()] = value.trim();
            }
        });
        
        if (Object.keys(formData).length > 0) {
            data = JSON.stringify(formData);
            if (!methodMatch) {
                method = 'POST';
            }
            // Set content-type if not already set
            if (!headers['Content-Type']) {
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
            }
        }
    }

    return { url, method, headers, data };
}

/**
 * Generates vRO JavaScript code from parsed curl command components
 * @param {Object} parsedCurl - The parsed curl command components
 * @param {string} parsedCurl.url - The URL from the curl command
 * @param {string} parsedCurl.method - The HTTP method (GET, POST, etc.)
 * @param {Object} parsedCurl.headers - The HTTP headers as key-value pairs
 * @param {string|null} parsedCurl.data - The request body data (if any)
 * @param {string} originalCurlCommand - The original curl command for reference
 * @returns {string} The generated vRO JavaScript code
 */
function generateVROCode(parsedCurl, originalCurlCommand) {
    const { url, method, headers, data } = parsedCurl;
    
    if (!url) {
        throw new Error('URL is required in the curl command');
    }

    // Handle URL parsing more safely
    let urlObj;
    try {
        urlObj = new URL(url);
    } catch (error) {
        throw new Error('Invalid URL format in curl command');
    }
    
    // Get current date for JSDoc
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Add JSDoc header to the generated code with improved description
    let vroCode = `/**
 * @description Makes a ${method} REST call to ${url}
 * @author curl2vRO
 * @version 1.0.0
 * @date ${currentDate}
 */

// Accept SSL certificate
var ld = Config.getKeystores().getImportCAFromUrlAction();
var model = ld.getModel();
model.value = "${url}";
var error = ld.execute();
if (error) {
    throw new Error("Failed to accept certificate for URL: " + "${url}" + ". Error: " + error);
}

// Create transient REST host
var restHost = RESTHostManager.createHost("dynamicRequest");
var httpRestHost = RESTHostManager.createTransientHostFrom(restHost);
httpRestHost.operationTimeout = 600;
httpRestHost.url = "${urlObj.origin}";

// Create REST request
var request = httpRestHost.createRequest("${method}", "${urlObj.pathname}${urlObj.search}", `;

    // Add request body if present
    if (data) {
        vroCode += `JSON.stringify(${data}));\n`;
    } else {
        vroCode += `null);\n`;
    }

    // Add headers
    if (Object.keys(headers).length > 0) {
        vroCode += '\n// Add headers\n';
        Object.entries(headers).forEach(([key, value]) => {
            vroCode += `request.setHeader("${key}", "${value}");\n`;
        });
    }

    // Add execution code
    vroCode += `
// Execute REST request
var response = request.execute();

// Handle response
if (response.statusCode == 200) {
    System.log("Request successful");
    var responseContent = JSON.parse(response.contentAsString);
    System.log(JSON.stringify(responseContent));
} else {
    throw "Request failed with status: " + response.statusCode;
}`;

    // Add the original curl command as a comment at the end
    vroCode += `\n\n/*\nOriginal curl command:\n${originalCurlCommand}\n*/`;

    return vroCode;
}

/**
 * Converts a curl command to vRO JavaScript code and saves it to a file
 * @param {string} curlCommand - The curl command to convert
 * @returns {string} The generated vRO JavaScript code
 * @throws {Error} If the curl command cannot be parsed properly
 */
function convertCurlToVRO(curlCommand) {
    try {
        const parsedCurl = parseCurlCommand(curlCommand);
        
        // Validate that we have a valid URL
        if (!parsedCurl.url) {
            throw new Error("URL not found in curl command");
        }
        
        const vroCode = generateVROCode(parsedCurl, curlCommand);
        
        // Generate filename from URL and method
        const urlObj = new URL(parsedCurl.url);
        const sanitizedPath = urlObj.pathname.replace(/[\/:\*?"<>|]/g, '_');
        const filename = `${urlObj.hostname}${sanitizedPath}_${parsedCurl.method}.js`;
        
        // Write to file using Node.js fs module
        const fs = require('fs');
        fs.writeFileSync(filename, vroCode);
        console.log(`vRO code has been saved to ${filename}`);
        
        return vroCode;
    } catch (error) {
        console.error("Error:", error.message);
        throw new Error("Unsupported curl command. Curl2vRO fails to parse it properly. Please check the command.");
    }
}

// Export the module with the new name
module.exports = {
    convertCurlToVRO,
    parseCurlCommand,
    generateVROCode
};
