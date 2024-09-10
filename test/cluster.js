import cluster from 'cluster';
import { cpus } from 'os';
import Maya from '../src/server.js';

const PORT = 3001;

if (cluster.isMaster) {
  const numCPUs = cpus().length;
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  const maya = new Maya();
  maya.listen(PORT, () => {
    console.log(`Worker ${process.pid} is listening on port ${PORT}`);
  });
}
