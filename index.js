import Porny from './src/server.js'

const app = new Porny()


app.post('/hi',(request) =>{
    const data= {
        body : request.body,
        query: request.query
    }
    return app.jsonResponse(data,200,'OK')
})

app.get('/',(request) => {
    return app.jsonResponse({data:"data"})
})

app.listen(3000)