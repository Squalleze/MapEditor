class Attributes extends Map {
  toString() {
    return [...this.entries()].map(([name, value]) => `${name}="${value.replace('"', '\\"')}"`).join(' ');
  }
}

class Node {
  constructor(tagName = 'Tag') {
    this.tagName = tagName;
    this.children = [];
    this.attributes = new Attributes();
  }
  append(child) {
    this.children.push(child);
    return this;
  }
  toXML() {
    if (this.children.length > 0) {
      return `<${this.tagName} ${this.attributes.toString()}>${this.children.map(e => e.toXML())}</${this.tagName}>`;
    } else {
      return `<${this.tagName} ${this.attributes.toString()}/>`;
    }
  }
  render() {
    return null;
  }
}

const node = new Node('He');
node.append(new Node('Hi'));
node.attributes.set('size', '10x30').set('index', '40');

console.log(node.toXML());