// trie.js
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    this.handler = null;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(path, route) {
    let node = this.root;
    for (const char of path) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
    node.handler = route;
  }

  search(path) {
    let node = this.root;
    for (const char of path) {
      if (!node.children[char]) {
        return null;
      }
      node = node.children[char];
    }
    return node.isEndOfWord ? node.handler : null;
  }
}

export default Trie;
