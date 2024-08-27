/**
 * @class ResponseHandler
 * @description Handles generating HTTP responses.
 */
class ResponseHandler {
  constructor() {}

  /**
   * Generates a full HTTP response.
   * @param {string|Object} data - The body of the response. Can be a string or an object (which will be JSON-stringified).
   * @param {number} [statusCode=200] - The HTTP status code.
   * @param {string} [statusMessage="OK"] - The HTTP status message.
   * @param {string} [contentType="text/plain"] - The content type of the response.
   * @param {Object.<string, string>} [headers={}] - Additional headers to include in the response.
   * @returns {string} The formatted HTTP response.
   * @private
   */
  _generateResponse(data, statusCode = 200, statusMessage = "OK", contentType = "text/plain", headers = {}) {
    let response = `HTTP/1.1 ${statusCode} ${statusMessage}\r\n`;
    response += `Content-Type: ${contentType}\r\n`;

    if (Object.keys(headers).length > 0) {
      for (const [key, value] of Object.entries(headers)) {
        response += `${key}: ${value}\r\n`;
      }
    }

    response += "\r\n"; // End of headers
    response += typeof data === "object" ? JSON.stringify(data) : data;
    return response;
  }

  /**
   * Generates a JSON response.
   * @param {Object} data - The JSON data to send.
   * @param {number} [statusCode=200] - The HTTP status code.
   * @param {string} [statusMessage="OK"] - The HTTP status message.
   * @returns {string} The formatted HTTP response.
   */
  json(data, statusCode = 200, statusMessage = "OK") {
    return this._generateResponse(data, statusCode, statusMessage, "application/json");
  }

  /**
   * Sends a response with the specified data.
   * @param {string} data - The data to send.
   * @param {number} [statusCode=200] - The HTTP status code.
   * @param {string} [statusMessage="OK"] - The HTTP status message.
   * @returns {string} The formatted HTTP response.
   */
  send(data, statusCode = 200, statusMessage = "OK") {
    return this._generateResponse(data, statusCode, statusMessage);
  }

  /**
   * Sends a redirect response.
   * @param {string} url - The URL to redirect to.
   * @param {number} [statusCode=302] - The HTTP status code for the redirect.
   * @returns {string} The formatted HTTP response.
   */
  redirect(url, statusCode = 302) {
    return this._generateResponse("", statusCode, "Found", "text/plain", { Location: url });
  }
}

export default new ResponseHandler();
