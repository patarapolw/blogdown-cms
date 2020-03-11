import { Parser } from 'htmlparser2'
import { elementOpen, elementClose, text } from 'incremental-dom'
import { Serialize } from 'any-serialize'

const ser = new Serialize()

export function makeIncremental (s: string): () => void {
  const open = (name: string, attr?: Record<string, string>) => {
    let isRendered = false

    if (name === 'reveal') {
      name = 'iframe'

      if (attr && attr.src) {
        const { src } = attr
        elementOpen('iframe', 'reveal-' + src, [
          'class', 'reveal-viewer', 'src',
          `/reveal.html?id=${src}`
        ])
        isRendered = true
      }
    } else if (name === 'pdf') {
      name = 'iframe'

      if (attr && attr.src) {
        const { src } = attr

        if (attr.type === 'google-drive') {
          elementOpen('iframe', 'gpdf-' + src, [
            'class', 'pdf-viewer', 'src',
            `https://drive.google.com/file/d/${src}/preview`
          ])
        } else {
          elementOpen('iframe', 'pdf-' + src, [
            'class', 'pdf-viewer', 'src',
            src
          ])
        }
        isRendered = true
      }
    }

    if (!isRendered) {
      elementOpen(name, name + '-' + ser.hash(attr || {}), attr ? Object.values(attr).flat() : [])
    }
  }

  const close = (name: string) => {
    if (name === 'reveal' || name === 'pdf') {
      name = 'iframe'
    }
    elementClose(name)
  }

  const iDOMParser = new Parser(
    {
      onopentag: open,
      // onopentagname: open,
      ontext: text,
      onclosetag: close
    },
    {
      decodeEntities: true,
      lowerCaseAttributeNames: false,
      lowerCaseTags: false,
      recognizeSelfClosing: true
    }
  )

  return () => {
    iDOMParser.write(s)
  }
}
