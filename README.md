# Porny

A simple HTTP server library.

## Installation

```bash
npm install mayajs

## How to Use

```bash
import Maya from 'maya';

const app = new Maya();

// Define a POST route
app.post('/', async (request) => {
    const data = {
        body: request.body,
        query: request?.query
    };
    return app.jsonResponse(data, 200, 'OK');
});

// Define an async GET route
app.get('/async-test', async (request) => {
    // Simulate a delay (e.g., database query)
    await new Promise(resolve => setTimeout(resolve, 1000));
    return app.jsonResponse({ message: 'Async operation completed' });
});

// Define a GET route that simulates an error
app.get('/error-test', async (request) => {
    // Simulate an error
    throw new Error('This is a test error');
});

// Define a GET route
app.get('/', (request) => {
    try {
        return app.jsonResponse({ data: 'data' });
    } catch (error) {
        console.error('Error in GET /:', error);
        return app.jsonResponse({ error: 'Internal Server Error' }, 500);
    }
});

// Start the server
app.listen(3000);

