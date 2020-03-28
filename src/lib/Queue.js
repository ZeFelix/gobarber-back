import Bee from 'bee-queue';
import CancellationMail from '../app/jobs/CancellationMail';

import redisConfig from '../config/redis';

const jobs = [CancellationMail];

class Queue {
  constructor() {
    this.queue = {};

    this.init();
  }

  init() {
    jobs.forEach(({ key, handle }) => {
      this.queue[key] = {
        bee: new Bee(key, {
          redis: redisConfig,
        }),
        handle,
      };
    });
  }

  add(queue, job) {
    return this.queue[queue].bee.createJob(job).save();
  }

  processQueue() {
    jobs.forEach((job) => {
      const { bee, handle } = this.queue[job.key];

      bee.process(handle);
    });
  }
}

export default new Queue();
