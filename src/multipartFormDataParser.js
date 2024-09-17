const fs = require( 'fs')

module.exports = async function parseMultipartFormData(requestBuffer, boundary) {
    const fields = {};
    const files = {};

    // Convert buffer to a string with 'latin1' encoding to preserve raw binary data.
    const requestString = requestBuffer.toString('latin1');
    // fs.writeFile('request_debug.txt', requestString, (err) => {
    //     if (err) {
    //         console.error("Error saving request data:", err);
    //     } else {
    //         console.log("Request data saved to request_debug.txt");
    //     }
    // });
    const parts = requestString.split(`--${boundary}`);
    for (let i = 1; i < parts.length; i++) {
        const part = parts[i].trim();
        // Split headers and data
        const [headerSection, ...dataParts] = part.split("\r\n\r\n");
        const headers = {};
        const data = dataParts.join("\r\n\r\n");

        // Extract headers
        const lines = headerSection.split("\r\n");
        for (const line of lines) {
            const [key, value] = line.split(": ");
            headers[key.toLowerCase()] = value;
        }

        console.log(headerSection)
        // Extract filename if present
        let filename = null;
        if (headers["content-disposition"]) {
            // console.log(headers["content-disposition"])
            const match = headers["content-disposition"].match(/filename="([^"]+)"/);
            if (match) {
                filename = match[1];
            }
        }

        if (filename) {
            files[filename] = {
                data: Buffer.from(data, 'latin1'), // Ensure binary data is preserved
                contentType: headers["content-type"],
                filename,
            };
        } else {
            const nameMatch = headers["content-disposition"].match(/name="([^"]+)"/);
            if (nameMatch) {
                fields[nameMatch[1]] = data.trim();
            }
        }
    }
    return { fields, files };
}
