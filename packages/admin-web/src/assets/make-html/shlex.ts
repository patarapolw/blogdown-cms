export interface ISplitOptions {
  brackets: [string, string][],
  split: string
  escape: string
  keepBrace?: boolean
}

export const defaultSplitOptions: ISplitOptions = {
  brackets: [['"', '"'], ["'", "'"]],
  split: ' ',
  escape: '\\'
}

/**
 *
 * @param ss
 * @param options
 *
 * ```js
 * > split('')
 * []
 * > split('a:b "c:d e:f"')
 * ['a:b', 'c:d e:f']
 * > split('a "b c" "d e"')
 * ['a', 'b c', 'd e']
 * ```
 */
export function split (ss: string, options: ISplitOptions = defaultSplitOptions) {
  const bracketStack = {
    data: [] as string[],
    push (c: string) {
      this.data.push(c)
    },
    pop () {
      return this.data.pop()
    },
    peek () {
      return this.data.length > 0 ? this.data[this.data.length - 1] : undefined
    }
  }
  const tokenStack = {
    data: [] as string[],
    currentChars: [] as string[],
    addChar (c: string) {
      this.currentChars.push(c)
    },
    flush () {
      const d = this.currentChars.join('')
      if (d) {
        this.data.push(d)
      }
      this.currentChars = []
    }
  }

  let prev = ''
  ss.split('').map((c) => {
    if (prev === options.escape) {
      tokenStack.addChar(c)
    } else {
      let canAddChar = true

      for (const [op, cl] of options.brackets) {
        if (c === cl) {
          if (bracketStack.peek() === op) {
            bracketStack.pop()
            canAddChar = false
            break
          }
        }

        if (c === op) {
          bracketStack.push(c)
          canAddChar = false
          break
        }
      }

      if (c === options.split && !bracketStack.peek()) {
        tokenStack.flush()
      } else {
        if (options.keepBrace || canAddChar) {
          tokenStack.addChar(c)
        }
      }
    }

    prev = c
  })

  tokenStack.flush()

  return tokenStack.data.map(s => s.trim()).filter(s => s)
}
