import katex from 'katex'
import { config } from 'md-editor-v3'
import 'katex/dist/katex.min.css'

config({
  editorExtensions: {
    katex: {
      instance: katex,
    },
  },
})
