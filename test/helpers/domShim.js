export function installDomShim() {
  const prev = {
    window: globalThis.window,
    document: globalThis.document,
    Node: globalThis.Node,
    Element: globalThis.Element,
    HTMLElement: globalThis.HTMLElement,
    Event: globalThis.Event,
    KeyboardEvent: globalThis.KeyboardEvent,
    IntersectionObserver: globalThis.IntersectionObserver,
    MutationObserver: globalThis.MutationObserver,
    localStorage: globalThis.localStorage,
    sessionStorage: globalThis.sessionStorage,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
    IS_REACT_ACT_ENVIRONMENT: globalThis.IS_REACT_ACT_ENVIRONMENT,
  }

  class MiniEvent {
    constructor(type, init = {}) {
      this.type = type
      this.bubbles = Boolean(init.bubbles)
      this.cancelable = Boolean(init.cancelable)
      this.defaultPrevented = false
      this.target = init.target || null
      this.currentTarget = null
      Object.assign(this, init)
    }
    preventDefault() {
      if (this.cancelable) {
        this.defaultPrevented = true
      }
    }
    stopPropagation() {}
  }

  class MiniKeyboardEvent extends MiniEvent {
    constructor(type, init = {}) {
      super(type, { cancelable: true, bubbles: true, ...init })
    }
  }

  function createStorage() {
    const map = new Map()
    return {
      getItem: (k) => (map.has(String(k)) ? map.get(String(k)) : null),
      setItem: (k, v) => { map.set(String(k), String(v)) },
      removeItem: (k) => { map.delete(String(k)) },
      clear: () => { map.clear() },
    }
  }

  class MiniNode {
    constructor(nodeType, nodeName, ownerDocument) {
      this.nodeType = nodeType
      this.nodeName = nodeName
      this.ownerDocument = ownerDocument
      this.parentNode = null
      this.childNodes = []
      this._listeners = new Map()
    }
    get firstChild() { return this.childNodes[0] || null }
    get lastChild() { return this.childNodes[this.childNodes.length - 1] || null }
    get nextSibling() {
      if (!this.parentNode) return null
      const idx = this.parentNode.childNodes.indexOf(this)
      return idx >= 0 ? this.parentNode.childNodes[idx + 1] || null : null
    }
    get previousSibling() {
      if (!this.parentNode) return null
      const idx = this.parentNode.childNodes.indexOf(this)
      return idx > 0 ? this.parentNode.childNodes[idx - 1] || null : null
    }
    get isConnected() {
      let cur = this
      while (cur) {
        if (cur === this.ownerDocument || cur === this.ownerDocument?.documentElement) return true
        cur = cur.parentNode
      }
      return false
    }
    contains(other) {
      let cur = other
      while (cur) {
        if (cur === this) return true
        cur = cur.parentNode
      }
      return false
    }
    appendChild(child) {
      return this.insertBefore(child, null)
    }
    insertBefore(child, refNode) {
      if (!child) return child
      if (child.nodeType === 11) {
        const items = [...child.childNodes]
        for (const item of items) {
          this.insertBefore(item, refNode)
        }
        return child
      }
      if (child.parentNode) {
        child.parentNode.removeChild(child)
      }
      child.parentNode = this
      if (!refNode) {
        this.childNodes.push(child)
      } else {
        const idx = this.childNodes.indexOf(refNode)
        if (idx === -1) this.childNodes.push(child)
        else this.childNodes.splice(idx, 0, child)
      }
      return child
    }
    removeChild(child) {
      const idx = this.childNodes.indexOf(child)
      if (idx !== -1) {
        this.childNodes.splice(idx, 1)
        child.parentNode = null
      }
      return child
    }
    replaceChild(newChild, oldChild) {
      this.insertBefore(newChild, oldChild)
      this.removeChild(oldChild)
      return oldChild
    }
    get textContent() {
      return this.childNodes.map((c) => c.textContent).join('')
    }
    set textContent(val) {
      this.childNodes.forEach((c) => { c.parentNode = null })
      this.childNodes = []
      if (val !== undefined && val !== null && String(val) !== '') {
        this.appendChild(this.ownerDocument.createTextNode(String(val)))
      }
    }
    addEventListener(type, fn) {
      if (!this._listeners.has(type)) this._listeners.set(type, new Set())
      this._listeners.get(type).add(fn)
    }
    removeEventListener(type, fn) {
      this._listeners.get(type)?.delete(fn)
    }
    dispatchEvent(event) {
      if (!event.target) event.target = this
      let cur = this
      while (cur) {
        event.currentTarget = cur
        const set = cur._listeners?.get(event.type)
        if (set) {
          for (const fn of [...set]) {
            fn.call(cur, event)
          }
        }
        cur = event.bubbles ? cur.parentNode : null
      }
      if (event.bubbles && this.ownerDocument?.defaultView && this !== this.ownerDocument.defaultView) {
        event.currentTarget = this.ownerDocument.defaultView
        const winSet = this.ownerDocument.defaultView._listeners?.get(event.type)
        if (winSet) {
          for (const fn of [...winSet]) {
            fn.call(this.ownerDocument.defaultView, event)
          }
        }
      }
      return !event.defaultPrevented
    }
  }

  class MiniText extends MiniNode {
    constructor(data, ownerDocument) {
      super(3, '#text', ownerDocument)
      this.data = String(data)
    }
    get nodeValue() { return this.data }
    set nodeValue(v) { this.data = String(v) }
    get textContent() { return this.data }
    set textContent(v) { this.data = String(v) }
  }

  class MiniComment extends MiniNode {
    constructor(data, ownerDocument) {
      super(8, '#comment', ownerDocument)
      this.data = String(data)
    }
    get textContent() { return '' }
  }

  class MiniFragment extends MiniNode {
    constructor(ownerDocument) {
      super(11, '#document-fragment', ownerDocument)
    }
  }

  class MiniElement extends MiniNode {
    constructor(tagName, ownerDocument, namespaceURI = 'http://www.w3.org/1999/xhtml') {
      super(1, tagName.toUpperCase(), ownerDocument)
      this.tagName = tagName.toUpperCase()
      this.namespaceURI = namespaceURI
      this._attrs = new Map()
      this.style = {
        setProperty: (k, v) => { this.style[k] = v },
        removeProperty: (k) => { delete this.style[k] },
      }
      this._value = ''
      this.dataset = new Proxy({}, {
        get: (_, prop) => {
          const attr = 'data-' + String(prop).replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
          return this._attrs.get(attr)
        },
        set: (_, prop, val) => {
          const attr = 'data-' + String(prop).replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
          this._attrs.set(attr, String(val))
          return true
        },
      })
      this.classList = {
        add: (...cls) => {
          const set = new Set((this.className || '').split(/\s+/).filter(Boolean))
          cls.forEach((c) => set.add(c))
          this.className = [...set].join(' ')
        },
        remove: (...cls) => {
          const set = new Set((this.className || '').split(/\s+/).filter(Boolean))
          cls.forEach((c) => set.delete(c))
          this.className = [...set].join(' ')
        },
        contains: (c) => (this.className || '').split(/\s+/).filter(Boolean).includes(c),
      }
    }
    get id() { return this._attrs.get('id') || '' }
    set id(v) { this._attrs.set('id', String(v)) }
    get className() { return this._attrs.get('class') || '' }
    set className(v) { this._attrs.set('class', String(v)) }
    get value() { return this._value }
    set value(v) { this._value = String(v ?? '') }
    get innerHTML() { return '' }
    set innerHTML(v) {
      if (v === '') {
        this.childNodes.forEach((c) => { c.parentNode = null })
        this.childNodes = []
      }
    }
    setAttribute(k, v) { this._attrs.set(String(k), String(v)) }
    getAttribute(k) { return this._attrs.has(String(k)) ? this._attrs.get(String(k)) : null }
    removeAttribute(k) { this._attrs.delete(String(k)) }
    hasAttribute(k) { return this._attrs.has(String(k)) }
    focus() {
      if (this.ownerDocument) {
        this.ownerDocument.activeElement = this
      }
    }
    blur() {
      if (this.ownerDocument?.activeElement === this) {
        this.ownerDocument.activeElement = this.ownerDocument.body
      }
    }
    click() {
      this.dispatchEvent(new MiniEvent('click', { bubbles: true, cancelable: true, target: this }))
    }
    scrollIntoView() {}
    getBoundingClientRect() {
      return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }
    }
    _matchesSelector(selector) {
      const sel = selector.trim()
      if (!sel) return false
      if (sel.startsWith('#')) return this.id === sel.slice(1)
      if (sel.startsWith('.')) return this.classList.contains(sel.slice(1))
      const attrMatch = sel.match(/^([a-z0-9_-]+)?\[([^=\]]+)(?:=["']?([^"'\]]+)["']?)?\]$/i)
      if (attrMatch) {
        const [, tag, attr, val] = attrMatch
        if (tag && this.tagName !== tag.toUpperCase()) return false
        if (val !== undefined) return this.getAttribute(attr) === val
        return this.hasAttribute(attr)
      }
      if (/^[a-z0-9]+$/i.test(sel)) {
        return this.tagName === sel.toUpperCase()
      }
      return false
    }
    querySelectorAll(selector) {
      const parts = selector.split(',').map((s) => s.trim()).filter(Boolean)
      const results = []
      const walk = (node) => {
        for (const child of node.childNodes) {
          if (child.nodeType === 1) {
            if (parts.some((p) => child._matchesSelector(p))) {
              results.push(child)
            }
            walk(child)
          }
        }
      }
      walk(this)
      return results
    }
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null
    }
  }

  class MiniDocument extends MiniNode {
    constructor(win) {
      super(9, '#document', null)
      this.ownerDocument = this
      this.defaultView = win
      this.title = ''
      this.documentElement = new MiniElement('html', this)
      this.head = new MiniElement('head', this)
      this.body = new MiniElement('body', this)
      this.documentElement.appendChild(this.head)
      this.documentElement.appendChild(this.body)
      this.appendChild(this.documentElement)
      this.activeElement = this.body
    }
    createElement(tag) { return new MiniElement(tag, this) }
    createElementNS(ns, tag) { return new MiniElement(tag, this, ns) }
    createTextNode(text) { return new MiniText(text, this) }
    createComment(text) { return new MiniComment(text, this) }
    createDocumentFragment() { return new MiniFragment(this) }
    getElementById(id) { return this.documentElement.querySelector(`#${id}`) }
    querySelector(sel) { return this.documentElement.querySelector(sel) }
    querySelectorAll(sel) { return this.documentElement.querySelectorAll(sel) }
  }

  const localStorage = createStorage()
  const sessionStorage = createStorage()

  const win = {
    _listeners: new Map(),
    localStorage,
    sessionStorage,
    location: { href: 'http://localhost/', pathname: '/', search: '' },
    history: { pushState: () => {}, replaceState: () => {} },
    navigator: { clipboard: { writeText: async () => {} } },
    scrollY: 0,
    innerHeight: 800,
    scrollTo: () => {},
    setTimeout: (...args) => globalThis.setTimeout(...args),
    clearTimeout: (...args) => globalThis.clearTimeout(...args),
    requestAnimationFrame: (cb) => globalThis.setTimeout(() => cb(Date.now()), 0),
    cancelAnimationFrame: (id) => globalThis.clearTimeout(id),
    matchMedia: () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
    addEventListener(type, fn) {
      if (!this._listeners.has(type)) this._listeners.set(type, new Set())
      this._listeners.get(type).add(fn)
    },
    removeEventListener(type, fn) {
      this._listeners.get(type)?.delete(fn)
    },
    dispatchEvent(event) {
      if (!event.target) event.target = this
      event.currentTarget = this
      const set = this._listeners.get(event.type)
      if (set) {
        for (const fn of [...set]) {
          fn.call(this, event)
        }
      }
      return !event.defaultPrevented
    },
  }

  const doc = new MiniDocument(win)
  win.document = doc
  win.Node = MiniNode
  win.Element = MiniElement
  win.HTMLElement = MiniElement
  win.HTMLIFrameElement = class HTMLIFrameElement extends MiniElement {}
  win.HTMLInputElement = class HTMLInputElement extends MiniElement {}
  win.HTMLTextAreaElement = class HTMLTextAreaElement extends MiniElement {}
  win.SVGElement = class SVGElement extends MiniElement {}
  win.Event = MiniEvent
  win.KeyboardEvent = MiniKeyboardEvent

  globalThis.window = win
  globalThis.document = doc
  globalThis.Node = MiniNode
  globalThis.Element = MiniElement
  globalThis.HTMLElement = MiniElement
  globalThis.Event = MiniEvent
  globalThis.KeyboardEvent = MiniKeyboardEvent
  globalThis.localStorage = localStorage
  globalThis.sessionStorage = sessionStorage
  globalThis.requestAnimationFrame = win.requestAnimationFrame
  globalThis.cancelAnimationFrame = win.cancelAnimationFrame
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.MutationObserver = class {
    observe() {}
    disconnect() {}
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true

  return {
    window: win,
    document: doc,
    KeyboardEvent: MiniKeyboardEvent,
    cleanup() {
      for (const [k, v] of Object.entries(prev)) {
        if (v === undefined) delete globalThis[k]
        else globalThis[k] = v
      }
    },
  }
}
