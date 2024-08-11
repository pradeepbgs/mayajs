import porny from './server.js'

const app = new porny()

app.get('/', (request) => {
    const data ={
        message: "Helloworld"
    } // Call your controller function
    return app.jsonResponse(data, 200, 'OK');
  });

app.listen(3000)