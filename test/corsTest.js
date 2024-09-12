import axios from "axios";

axios.get('http://localhost:3000/test', {
  name:"nameeeee"
}, {
  headers: {
    'Origin': 'http://localhost:3000',
    'X-Custom-Header': 'value'
  }
})
.then(response => console.log(response.data))
.catch(error => console.error('Error:', error));
