const events = ['click']
function parseURLParams(url) {
    let queryParams = {}
    let reg = /([^?=&]+)=([^?=&]+)/g
    url.replace(reg, function () {
        queryParams[arguments[1]] = arguments[2]
    })
    return queryParams
}
function $import(url, e) {
    const { mod } = parseURLParams(url)
    import(url).then(mods => {
        const newState = mods[mod](window.__state, e)
        window.dispatch(newState)
    })
}

for (const event of events) {
    document.addEventListener(event, e => {
        const target = e.target;
        if (target) {
            $import(target.getAttribute('$on' + event), e)

        }
    })
}

function resume(root) {
    window.dispatch = (newState) => {
        window.__state = { ...window.__state, ...newState }
        import('./app.js').then(mod => {
            const vdom = mod.default(window.__state)
            patch(root, vdom, root.firstChild, 0)
        })
    }

}

function patch(parent, node, oldNode, index) {
    if (node.type === 3 && oldNode.nodeType === 3) {
        if (oldNode.nodeValue !== node.tag) {
            oldNode.nodeValue = node.tag
        }

    }
    else if (!oldNode) {
        parent.appendChild(createElement(node))

    } else if (!node) {
        while (index > 0 && !parent.childNodes[index]) {
            index--
        }
        var dom = parent.childNodes[index]
        parent.removeChild(dom)

    } else if (oldNode.nodeName.toLowerCase() !== node.tag) {
        parent.replaceChild(createElement(node), parent.childNodes[index])

    } else if (node.tag) { // diff
        var dom = parent.childNodes[index]

        updateElement(dom, node)

        var len = node.children.length, oldLen = oldNode.children.length
        for (var i = 0; i < len || i < oldLen; i++) {
            patch(dom, node.children[i], oldNode.childNodes[i], i)
        }
    }
}

function updateElement(node, vnode) {
    for (const name in vnode.props) { // need diff
        if (name[0] === '$') continue
        if (!(name in node.attributes) || node.getAttribute(name) !== vnode.props[name]) {
            if (name in node) {
                node[name] = vnode.props[name]
            } else {
                node.setAttribute(name, vnode.props[name])
            }
        }

    }
}

function createElement(vdom) {
    const dom =
        vdom.type === 3
            ? document.createTextNode('')
            : document.createElement(vdom.tag)

    for (var i = 0; i < vdom.children.length; i++) {
        dom.appendChild(
            createElement(
                vdom.children[i]
            )
        )
    }
    return (vdom.node = dom)
}

resume(document.body)