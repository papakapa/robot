class Queue {
  constructor(queue = []) {
    this.queue = queue;
  }

  enqueue(el) {
    this.queue.push(el);
  }

  enqueueArray(arr) {
    arr.forEach(el => this.queue.push(el));
  }

  dequeue() {
    const [a] = this.queue;
    this.queue.shift();

    return a;
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  getLength() {
    return this.queue.length;
  }
}

module.exports = {
  Queue,
};
