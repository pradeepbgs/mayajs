#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char method[10];
    char path[256];
    char version[10];
    char headers[10][256];
    char values[10][256];
    char cookies[10][256];
    char cookie_values[10][256];
} Request;

const char* parse_headers(const char *request) {
    static char result[1024]; // Buffer to hold the JSON result
    Request req;
    memset(&req, 0, sizeof(req)); // Initialize the struct

    if (request == NULL) {
        snprintf(result, sizeof(result), "{\"error\":\"Received NULL pointer\"}");
        return result;
    }

    char *request_copy = strdup(request);
    char *header_section = strstr(request_copy, "\r\n\r\n");
    if (header_section == NULL) {
        snprintf(result, sizeof(result), "{\"error\":\"Invalid request format: Missing header section\"}");
        free(request_copy);
        return result;
    }
    *header_section = '\0'; // Terminate the request line section

    // Parse request line
    sscanf(request_copy, "%s %s %s", req.method, req.path, req.version);

    // Split into headers
    char *header_line = header_section + 4; // Skip the "\r\n\r\n"
    char *line = strtok(header_line, "\r\n");
    int header_count = 0;

    while (line != NULL && header_count < 10) {
        char *delimiter_pos = strstr(line, ": ");
        if (delimiter_pos) {
            *delimiter_pos = '\0';  // Replace ": " with null character
            strcpy(req.headers[header_count], line);
            strcpy(req.values[header_count], delimiter_pos + 2); // Get value
            header_count++;
        }
        line = strtok(NULL, "\r\n");
    }

    // Parse cookies if present
    for (int i = 0; i < header_count; i++) {
        if (strcasecmp(req.headers[i], "Cookie") == 0) {
            char *cookie_line = req.values[i];
            char *cookie = strtok(cookie_line, ";");
            int cookie_count = 0;

            while (cookie != NULL && cookie_count < 10) {
                char *equal_pos = strstr(cookie, "=");
                if (equal_pos) {
                    *equal_pos = '\0'; // Split cookie key
                    strcpy(req.cookies[cookie_count], cookie);
                    strcpy(req.cookie_values[cookie_count], equal_pos + 1); // Get value
                    cookie_count++;
                }
                cookie = strtok(NULL, ";");
            }
        }
    }

    // Build JSON result
    snprintf(result, sizeof(result), "{ \"method\": \"%s\", \"path\": \"%s\", \"version\": \"%s\", \"headers\": [", req.method, req.path, req.version);
    for (int i = 0; i < header_count; i++) {
        strcat(result, "{\"");
        strcat(result, req.headers[i]);
        strcat(result, "\": \"");
        strcat(result, req.values[i]);
        strcat(result, "\"}");
        if (i < header_count - 1) strcat(result, ",");
    }
    strcat(result, "]}");

    free(request_copy);
    return result;
}
