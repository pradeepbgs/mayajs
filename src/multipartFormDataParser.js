export const parseMultipartFormData = (requestBuffer, boundary) => {
    const fields = {};
    const files = {};

    // Convert buffer to a string with 'latin1' encoding to preserve raw binary data.
    const requestString = requestBuffer.toString('latin1');
    const parts = requestString.split(`--${boundary}`);

    for (let i = 1; i < parts.length - 1; i++) {
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

        // Extract filename if present
        let filename = null;
        if (headers["content-disposition"]) {
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
};
