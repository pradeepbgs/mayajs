
const CACHE_TTL = 10 * 1000;
const MAX_CACHE_SIZE = 10000; 

class Cache {
    constructor() {
        this.getCache = new Map()
    }


 setCache(key,value) {
    const timeStamp = Date.now()
    if (this.getCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = getCache.keys().next().value;
      this.getCache.delete(oldestKey);
    }
    this.getCache.set(key,{value,timeStamp})
  }
  
getCached (key) {
      const cached = this.getCache.get(key)
      if (cached && (Date.now() - cached.timeStamp) < CACHE_TTL) {
        this.getCache.delete(key);
      this.getCache.set(key, cached);
        return cached.value;
      } else {
        this.getCache.delete(key);
        return null;
      }
  }
}

export  default  Cache;