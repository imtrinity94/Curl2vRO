# curl2vRO

[![npm version](https://img.shields.io/npm/v/curl2vro.svg)](https://www.npmjs.com/package/curl2vro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/curl2vro.svg)](https://www.npmjs.com/package/curl2vro)

A utility to convert curl commands to VMware vRealize Orchestrator (vRO) JavaScript code.

## Requirements

- Node.js 12.x or higher
- VMware vRealize Orchestrator environment for running the generated code

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Examples](#examples)
  - [Basic GET Request](#basic-get-request)
  - [POST Request with JSON Body](#post-request-with-json-body)
  - [PUT Request with Authentication](#put-request-with-authentication)
  - [DELETE Request](#delete-request)
  - [Request with Query Parameters](#request-with-query-parameters)
- [API Reference](#api-reference)
- [Supported Curl Features](#supported-curl-features)
- [License](#license)
- [Author](#author)
- [Contributing](#contributing)
- [Development](#development)

## Installation

```bash
npm install curl2vro
```

## Usage

```javascript
const curl2vRO = require('curl2vRO');

// Your curl command
const curlCommand = `curl https://api.example.com/data`;

// Convert to vRO code
const vroCode = curl2vRO.convertCurlToVRO(curlCommand);
console.log(vroCode);
```

The tool will generate a JavaScript file with the vRO code and save it in the current directory. The filename is derived from the hostname, path, and HTTP method.

## Features

- Converts curl commands to vRO JavaScript code
- Supports various HTTP methods (GET, POST, PUT, DELETE, etc.)
- Handles request headers
- Processes request body data (JSON, form data)
- Automatically generates appropriate filenames
- Adds JSDoc documentation to generated code
- Includes original curl command as a comment for reference

## Examples

### Basic GET Request

```javascript
// Input
const curlCommand = `curl -X GET https://api.sampleapis.com/coffee/hot`;

// Output
/**
 * @description Curl to vRO JavaScript converted code
 * @author curl2vRO
 * @version 1.0.0
 * @date 2025-05-15
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
```

### POST Request with JSON Body

```javascript
// Input
const curlCommand = `curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token123" \
  -d '{"name": "John Doe", "email": "john@example.com"}'`;

// Output
/**
 * @description Curl to vRO JavaScript converted code
 * @author curl2vRO
 * @version 1.0.0
 * @date 2025-05-15
 */

// Accept SSL certificate
var ld = Config.getKeystores().getImportCAFromUrlAction();
var model = ld.getModel();
model.value = "https://api.example.com/users";
var error = ld.execute();
if (error) {
    throw new Error("Failed to accept certificate for URL: " + "https://api.example.com/users" + ". Error: " + error);
}

// Create transient REST host
var restHost = RESTHostManager.createHost("dynamicRequest");
var httpRestHost = RESTHostManager.createTransientHostFrom(restHost);
httpRestHost.operationTimeout = 600;
httpRestHost.url = "https://api.example.com";

// Create REST request
var request = httpRestHost.createRequest("POST", "/users", JSON.stringify({"name": "John Doe", "email": "john@example.com"}));

// Add headers
request.setHeader("Content-Type", "application/json");
request.setHeader("Authorization", "Bearer token123");

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
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token123" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
*/
```

### PUT Request with Authentication

```javascript
// Input
const curlCommand = `curl --location --request PUT 'https://api.example.com/resources/123' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic dXNlcjpwYXNzd29yZA==' \
--data-raw '{
    "title": "Updated Resource",
    "status": "active",
    "priority": 1
}'`;

// Output
/**
 * @description Curl to vRO JavaScript converted code
 * @author curl2vRO
 * @version 1.0.0
 * @date 2025-05-15
 */

// Accept SSL certificate
var ld = Config.getKeystores().getImportCAFromUrlAction();
var model = ld.getModel();
model.value = "https://api.example.com/resources/123";
var error = ld.execute();
if (error) {
    throw new Error("Failed to accept certificate for URL: " + "https://api.example.com/resources/123" + ". Error: " + error);
}

// Create transient REST host
var restHost = RESTHostManager.createHost("dynamicRequest");
var httpRestHost = RESTHostManager.createTransientHostFrom(restHost);
httpRestHost.operationTimeout = 600;
httpRestHost.url = "https://api.example.com";

// Create REST request
var request = httpRestHost.createRequest("PUT", "/resources/123", JSON.stringify({
    "title": "Updated Resource",
    "status": "active",
    "priority": 1
}));

// Add headers
request.setHeader("Content-Type", "application/json");
request.setHeader("Authorization", "Basic dXNlcjpwYXNzd29yZA==");

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
curl --location --request PUT 'https://api.example.com/resources/123' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic dXNlcjpwYXNzd29yZA==' \
--data-raw '{
    "title": "Updated Resource",
    "status": "active",
    "priority": 1
}'
*/
```

### DELETE Request

```javascript
// Input
const curlCommand = `curl -X DELETE https://api.example.com/users/123 \
  -H "Authorization: Bearer token123"`;

// Output
/**
 * @description Curl to vRO JavaScript converted code
 * @author curl2vRO
 * @version 1.0.0
 * @date 2025-05-15
 */

// Accept SSL certificate
var ld = Config.getKeystores().getImportCAFromUrlAction();
var model = ld.getModel();
model.value = "https://api.example.com/users/123";
var error = ld.execute();
if (error) {
    throw new Error("Failed to accept certificate for URL: " + "https://api.example.com/users/123" + ". Error: " + error);
}

// Create transient REST host
var restHost = RESTHostManager.createHost("dynamicRequest");
var httpRestHost = RESTHostManager.createTransientHostFrom(restHost);
httpRestHost.operationTimeout = 600;
httpRestHost.url = "https://api.example.com";

// Create REST request
var request = httpRestHost.createRequest("DELETE", "/users/123", null);

// Add headers
request.setHeader("Authorization", "Bearer token123");

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
curl -X DELETE https://api.example.com/users/123 \
  -H "Authorization: Bearer token123"
*/
```

### Request with Query Parameters

```javascript
// Input
const curlCommand = `curl "https://api.example.com/search?q=test&limit=10" \
  -H "Accept: application/json"`;

// Output
/**
 * @description Curl to vRO JavaScript converted code
 * @author curl2vRO
 * @version 1.0.0
 * @date 2025-05-15
 */

// Accept SSL certificate
var ld = Config.getKeystores().getImportCAFromUrlAction();
var model = ld.getModel();
model.value = "https://api.example.com/search?q=test&limit=10";
var error = ld.execute();
if (error) {
    throw new Error("Failed to accept certificate for URL: " + "https://api.example.com/search?q=test&limit=10" + ". Error: " + error);
}

// Create transient REST host
var restHost = RESTHostManager.createHost("dynamicRequest");
var httpRestHost = RESTHostManager.createTransientHostFrom(restHost);
httpRestHost.operationTimeout = 600;
httpRestHost.url = "https://api.example.com";

// Create REST request
var request = httpRestHost.createRequest("GET", "/search?q=test&limit=10", null);

// Add headers
request.setHeader("Accept", "application/json");

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
curl "https://api.example.com/search?q=test&limit=10" \
  -H "Accept: application/json"
*/
```

## API Reference

### convertCurlToVRO(curlCommand)

Converts a curl command to vRO JavaScript code and saves it to a file.

- **Parameters**
  - `curlCommand` (string): The curl command to convert
- **Returns**
  - (string): The generated vRO JavaScript code

### parseCurlCommand(curlCommand)

Parses a curl command and extracts its components.

- **Parameters**
  - `curlCommand` (string): The curl command to parse
- **Returns**
  - (Object): An object containing the parsed components (url, method, headers, data)

### generateVROCode(parsedCurl, originalCurlCommand)

Generates vRO JavaScript code from parsed curl command components.

- **Parameters**
  - `parsedCurl` (Object): The parsed curl command components
    - `url` (string): The URL from the curl command
    - `method` (string): The HTTP method (GET, POST, etc.)
    - `headers` (Object): The HTTP headers as key-value pairs
    - `data` (string|null): The request body data (if any)
  - `originalCurlCommand` (string): The original curl command for reference
- **Returns**
  - (string): The generated vRO JavaScript code

## Supported Curl Features

- HTTP methods: GET, POST, PUT, DELETE, PATCH, etc.
- Request headers with `-H` or `--header`
- Request body data with `-d`, `--data`, `--data-raw`, `--data-binary`
- URL specification with or without quotes
- Basic authentication
- Form data

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Mayank Goyal  
Website: [cloudblogger.co.in](https://cloudblogger.co.in)  
Email: mayankgoyalmax@gmail.com

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Development

To set up the development environment:

```bash
# Clone the repository
git clone https://github.com/yourusername/curl2vro.git

# Install dependencies
cd curl2vro
npm install

# Run tests
npm test
```
