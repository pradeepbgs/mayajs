const Maya = require("./server.js");

class Router extends Maya{
    constructor() {
      super()
    }
    #defineRoute(method, path) {
        const chain = {
          handler: (...handlers) => {
            if (handlers.length > 1){
              if (!this.trie.root.subMiddlewares.has(path)) {
                this.trie.root.subMiddlewares.set(path,[])
              } 
              const middlewareHandlers = handlers.slice(0, -1);
              
              if (!this.trie.root.subMiddlewares.get(path).includes(...middlewareHandlers)) {
                  this.trie.root.subMiddlewares.get(path).push(...middlewareHandlers)
              }
            }
            const handler = handlers[handlers.length-1]
            this.trie.insert(path, { handler, method })
          }
        };
        return chain;
      }

      #addMiddlewareAndHandler(method, path, handlers) {
        if (!this.trie.root.subMiddlewares.has(path)) {
          this.trie.root.subMiddlewares.set(path,[])
        }  
        const middlewareHandlers = handlers.slice(0, -1);
        if (path === "/") {
          if (!this.globalMidlleware.includes(...middlewareHandlers)) {
            this.globalMidlleware.push(...middlewareHandlers);
          }
        } else {
          if (!this.midllewares.get(path).includes(...middlewareHandlers)) {
            this.midllewares.get(path).push(...middlewareHandlers);
          }
        }
    
        const handler = handlers[handlers.length - 1];
        return this.trie.insert(path, { handler, method });
      }

      get(path,...handlers) {
        if (handlers.length > 0) {
          return this.#addMiddlewareAndHandler("GET", path, handlers);
        }
        return this.#defineRoute("GET", path);
      }
    
      post(path) {
        return this.#defineRoute("POST", path);
      }
    
      put(path) {
        return this.#defineRoute("PUT", path);
      }
    
      delete(path) {
        return this.#defineRoute("DELETE", path);
      }
    
      patch(path) {
        return this.#defineRoute("PATCH", path);
      }
}

module.exports = Router