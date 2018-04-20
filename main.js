const IMAGE_HOST = 'http://transformice.com/images/'
const MAX_WIDTH = 1600
const MAX_DEFILATE_WIDTH = 4800

let map = document.getElementById('map')
let main = {
  xml: document.getElementById('xml'),
  tree: document.getElementById('tree'),
  background: map.getElementById('background'),
  f_holes: map.getElementById('f-holes'),
  f_cheeses: map.getElementById('f-cheeses'),
  f_decoration: map.getElementById('f-decoration'),
  b_images: map.getElementById('b-images'),
  b_joints: map.getElementById('b-joints'),
  b_grounds: map.getElementById('b-grounds'),
  foreground: map.getElementById('foreground'),
  f_holes: map.getElementById('f-holes'),
  f_cheeses: map.getElementById('f-cheeses'),
  objects: map.getElementById('objects'),
  f_joints: map.getElementById('f-joints'),
  f_images: map.getElementById('f-images'),
  f_grounds: map.getElementById('f-grounds'),
  f_decoration: map.getElementById('f-decoration'),
  debug: map.getElementById('debug')
}
//
// class Map {
//   constructor(xml) {
//     this.xml = xml
//   }
// }

class EditorElementList {
  constructor() {this.list = []}
  get(regexp) {
    let tree = []
    for (let el of this.list) {
      while(tree.length > el.level) tree.pop()
      tree.push(el.name)
      if (regexp.test(tree.join('>'))) return el
    }
  }
  getAll(regexp) {
    let out = new EditorElementList
    let tree = []
    for (let el of this.list) {
      while(tree.length > el.level) tree.pop()
      tree.push(el.name)
      if (regexp.test(tree.join('>'))) out.append(el)
    }
    return out
  }
  append(...e) {
    for (let el of e)
      if (el instanceof EditorElement) this.list.push(el)
  }
  *[Symbol.iterator]() {
    for (let el of this.list)
      yield el
  }
}

class EditorAttr {
  constructor(name, value) {
    this.name = name
    this.value = value

    this.tree = {
      row: document.createElement('div'),
      name: document.createElement('input'),
      value: document.createElement('input'),
      del: document.createElement('input'),
    }
    // row
    this.tree.row.classList.add('tr')
    // name
    this.tree.name.type = 'text'
    this.tree.name.classList.add('td')
    // value
    this.tree.value.type = 'text'
    this.tree.value.classList.add('td')
    // del
    this.tree.del.type = 'button'
    this.tree.del.textContent = '×'
    this.tree.del.title = 'Click to remove'
    this.tree.del.classList.add('td', 'del')

  }
  onUpdate() {
    this.tree.name.value = this.name
    this.tree.value.value = this.value
  }
}

class EditorElement {
  constructor(name) {
    this.name = name
    this.attr = new Map
    this.isSelected = false
    this.level = 0

    // xml tree
    this.tree = {
      row: document.createElement('div'),
      cell1: document.createElement('div'),
      cell2: document.createElement('input'),
      cell3: document.createElement('div'),
      cell4: document.createElement('div')
    }

    // row
    this.tree.row.classList.add('tr')
    this.tree.row.addEventListener('click', e => {
      console.log(e)
      // console.log(this)
      this.select()
    })

    // hidden cell
    this.tree.cell1.classList.add('td')

    // name
    this.tree.cell2.setAttribute('type', 'text')
    this.tree.cell2.classList.add('td')
    this.tree.cell2.placeholder = this.name
    this.tree.cell2.style.width = '200px'

    // attributes
    this.tree.cell3.classList.add('td')

    // del button
    this.tree.cell4.classList.add('td', 'del')
    this.tree.cell4.textContent = '×'
    this.tree.cell4.title = 'Click to remove'

    // append children
    this.tree.row.appendChild(this.tree.cell1)
    this.tree.row.appendChild(this.tree.cell2)
    this.tree.row.appendChild(this.tree.cell3)
    this.tree.row.appendChild(this.tree.cell4)
    this.onUpdate()
  }
  onUpdate() {
    this.tree.cell1.textContent = this.level
    this.tree.cell2.value = this.name
    this.tree.cell2.style.paddingLeft = `${5 + this.level * 15}px`
    this.tree.cell3.textContent = [...this.attr.entries()].map(attr => `${attr[0]}="${attr[1]}"`).join(', ') || '[empty]'
  }
  select() {this.isSelected = true; this.onSelect()}
  onSelect() {

  }
  onUnselect() {}
  get treeElement() {return this.tree.row}
  setLevel(level) {this.level = level; this.onUpdate()}
  setName(name) {
    if (/^[:a-z_][:a-z_\-.]*$/i.test(name)) {
      this.name = name
      this.onUpdate()
    } else
      throw 'Invalid name'
  }
  // value = /^[^<&"]*$/
  setAttr(name, value) {this.attr.set(name, value); this.onUpdate()}
  setAttrs(tags) {this.onUpdate()}
  getAttr(name) {return this.attr.get(name)}
  delAttr(name) {this.attr.delete(name); this.onUpdate()}
  hasAttr(name) {return this.attr.has(name)}
  clearAttrs() {this.attr.clear(); this.onUpdate()}
  toString() {
    if (this.children.length)
      return `<${this.name}>${this.children}</${this.name}>`
    else
      return `<${this.name}/>`
  }
}

function selectObject(obj) {
  console.log(obj)
}


function createElement(name) {
  return document.createElementNS('http://www.w3.org/2000/svg', name)
}
function loadXML() {
  let parser = new DOMParser
  try {
    let doc = parser.parseFromString(main.xml.value, 'text/xml')
    buildXML(doc.activeElement)
  } catch (e) {
    console.error(e)
  }
}

function toJSON(node) {
  let out = {}
  if (node.nodeType !== 1) return

  out.attr = fromAttr(node.attributes)
  out.name = node.nodeName
  out.src = node
  out.children = []
  for (let child of node.children) out.children.push(toJSON(child))
  return out
}

function fromAttr(node) {
  let out = {}
  for (let attr of node) out[attr.name] = attr.value
  return out
}

// Converts a node to EditorElement
function convertNode(list, node, level = 0) {
  if (node.nodeType !== 1) return
  let el = new EditorElement(node.nodeName)
  el.setLevel(level)
  for (let {name, value} of node.attributes) el.setAttr(name, value)
  list.append(el)
  for (let child of node.children) convertNode(list, child, level + 1)
}

function buildXML(xml) {
  let tree = new EditorElementList
  convertNode(tree, xml)
  console.log(tree)
  for (let el of tree)
    main.tree.appendChild(el.treeElement)
  /*
  XML = toJSON(xml.activeElement)
  let joints = XML.children.find(find('Z')).children.find(find('L'))
  let grounds = XML.children.find(find('Z')).children.find(find('S'))
  for (let ground of grounds.children) if (ground.name === 'S') drawGround(ground)
  for (let joint of joints.children)
    switch(joint.name) {
      case 'JD':
      case 'JP':
      case 'JR':
      case 'JPL': drawJoint(joint); break
      // default: console.error()
    }
  // xml.children.find(function(e) {})
  */
}

groundSize = size => Math.min(3000, Math.max(10, parseInt(size) || 10))

function drawGround(ground) {
  // let el = createElement('rect')
  // el.setAttribute('width', groundSize(ground.L))
  // el.setAttribute('height', groundSize(ground.H))
  // el.setAttribute('x', ground.X)
  // el.setAttribute('y', ground.Y)
  // console.log(ground)
}

Joint = {}
Joint.parse = {}
Joint.parse.c = (c => c.match(/[^,]+/g))
Joint.parse.P = (P => P.match(/[^,]+/g).map(e => parseInt(e) || e))

function drawJoint(joint) {
  let group = createElement('g')
  let [color, thickness, alpha, foreground] = Joint.parse.c(joint.attr.c)
  color = parseInt(color, 16)
  let rgba = 'rgba(' + [color >> 16 & 255, color >> 8 & 255, color & 255, alpha || 1].join(',') + ')'
  let el

  switch(joint.name) {
    case 'JD': {
      el = createElement('line')
      let points = [createElement('path'), createElement('path')]

      let P1 = Joint.parse.P(joint.attr.P1)
      let P2 = Joint.parse.P(joint.attr.P2)
      el.setAttribute('x1', P1[0])
      el.setAttribute('y1', P1[1])
      el.setAttribute('x2', P2[0])
      el.setAttribute('y2', P2[1])

      let debug = createElement('g')
      // points[0].setAttribute('r', 5)
      points[0].setAttribute('x', P1[0])
      points[0].setAttribute('y', P1[1])
      points[0].setAttribute('d', 'm5 0 v10 m0 5 h10')
      points[0].setAttribute('stroke', 'blue')
      points[0].setAttribute('stroke-width', 2)
      points[1].setAttribute('r', 5)
      points[1].setAttribute('cx', P2[0])
      points[1].setAttribute('cy', P2[1])

      debug.appendChild(points[0])
      debug.appendChild(points[1])

      debug.setAttribute('stroke', 'blue')
      debug.setAttribute('stroke-width', 2)
      // debug.setAttribute('fill', 'none')
      // debug.setAttribute('d', 'M5 0 V10 M0 5 H10Z')
      // group.appendChild(debug)
      main.debug.appendChild(debug)
      break
    }
    case 'JPL':
      el = createElement('path')
      let points = [
        Joint.parse.P(joint.attr.P1),
        Joint.parse.P(joint.attr.P3),
        Joint.parse.P(joint.attr.P4),
        Joint.parse.P(joint.attr.P2)
      ]
      console.log(`M${points.join(' L')}`)
      el.setAttribute('d', `M${points.join(' L')}`)
      break
    case 'JP':
    case 'JR': null
  }

  el.setAttribute('stroke', rgba)
  el.setAttribute('stroke-width', thickness)
  el.setAttribute('fill', 'none')
  el.onclick = selectObject
  group.appendChild(el)
  if (foreground == 1)
    main.f_joints.appendChild(group)
  else
    main.b_joints.appendChild(group)
}

function drawImage(cmd, foreground) {
  let cmds = cmd.match(/[^;]+/g).reverse()
  for (let cmd of cmds) {
    let [file, x, y, times] = cmd.match(/[^,]+/g)
    x = parseInt(x) || 0
    y = parseInt(y) || 0
    times = parseInt(times) || 0

    let image = new Image
    let group = createElement('g')
    let el = createElement('image')
    image.src = IMAGE_HOST + file
    el.setAttribute('href', image.src)
    el.setAttribute('x', x)
    el.setAttribute('y', y)
    image.onload = function() {
      for (let img of group.children) {
        img.setAttribute('width', this.width)
        img.setAttribute('height', this.height)
      }
    }

    // append image to group
    group.appendChild(el)
    for (let i = 0; i < times; i++) {
      let clone = el.cloneNode()
      clone.setAttribute('x', x + 800 * (i + 1))
      group.appendChild(clone)
    }
    let parent = main[foreground ? 'f_images' : 'b_images']
    parent.appendChild(group)
  }
}


function find(name) {return e => {if (e.name === name) return e}}
loadXML()
// drawImage('fond-niveau.png,400,200,5;x_transformice/x_maps/x_papaques_2015/map1.jpg,0,0,2', false)
