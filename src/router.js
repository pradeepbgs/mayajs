const {Maya} = require("./server.js");

class Router extends Maya{
    constructor() {
      super()
    }
    // #defineRoute(method, path) {
    //     const chain = {
    //       handler: (...handlers) => {
    //         if (handlers.length > 1){
    //           if (!this.trie.root.subMiddlewares.has(path)) {
    //             this.trie.root.subMiddlewares.set(path,[])
    //           } 
    //           const middlewareHandlers = handlers.slice(0, -1);
              
    //           if (!this.trie.root.subMiddlewares.get(path).includes(...middlewareHandlers)) {
    //               this.trie.root.subMiddlewares.get(path).push(...middlewareHandlers)
    //           }
    //         }
    //         const handler = handlers[handlers.length-1]
    //         this.trie.insert(path, { handler, method })
    //       }
    //     };
    //     return chain;
    //   }

      // #addMiddlewareAndHandler(method, path, handlers) {
      //   if (!this.trie.root.subMiddlewares.has(path)) {
      //     this.trie.root.subMiddlewares.set(path,[])
      //   }  
      //   const middlewareHandlers = handlers.slice(0, -1);

      //     if (!this.trie.root.subMiddlewares.get(path).includes(...middlewareHandlers)) {
      //       this.trie.root.subMiddlewares.get(path).push(...middlewareHandlers)
      //     }    

      //   const handler = handlers[handlers.length - 1];
      //   return this.trie.insert(path, { handler, method });
      // }

      get(path,...handlers) {
        if (handlers.length > 0) {
          return this.addMiddlewareAndHandler("GET", path, handlers);
        }
        return this.addRoute("GET", path);
      }
    
      post(path,...handlers) {
        if (handlers.length > 0) {
          return this.addMiddlewareAndHandler("POST", path, handlers);
        }
        return this.addRoute("POST", path);
      }
    
      put(path,...handlers) {
        if (handlers.length > 0) {
          return this.addMiddlewareAndHandler("PUT", path, handlers);
        }
        return this.addRoute("PUT", path);
      }
    
      delete(path,...handlers) {
        if (handlers.length > 0) {
          return this.addMiddlewareAndHandler("DELETE", path, handlers);
        }
        return this.addRoute("DELETE", path);
      }
    
      patch(path,...handlers) {
        if (handlers.length > 0) {
          return this.addMiddlewareAndHandler("PATCH", path, handlers);
        }
        return this.addRoute("PATCH", path);
      }
}

module.exports = Router