import Porny from './src/server.js'

const app = new Porny()


app.post('/',async (request) =>{
    const data = {
        body : request.body,
        query: request?.query
    }
    return app.jsonResponse(data,200,'OK')
})
app.get('/async-test', async (request) => {
    // Simulate a delay (e.g., database query)
    await new Promise(resolve => setTimeout(resolve, 1000));
    return app.jsonResponse({ message: 'Async operation completed' });
  });

  app.get('/error-test', async (request) => {
    // Simulate an error
    throw new Error('This is a test error');
  });
  
  app.get('/', (request) => {
    try {
        return app.jsonResponse({ data: "data" });
    } catch (error) {
        console.error('Error in GET /:', error);
        return app.jsonResponse({ error: 'Internal Server Error' }, 500);
    }
});

app.listen(3000)