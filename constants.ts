import { Language } from './types';

/**
 * =====================================
 * Language Runtime Definitions
 * Using FULL official Docker images
 * =====================================
 */

export const LANGUAGES: Language[] = [
  /* =======================
   * JavaScript / Node.js
   * ======================= */
  {
    id: 'javascript',
    name: 'Node.js',
    prismId: 'javascript',
    interpreters: [
      {
        id: 'node-docker',
        name: 'Node.js 20',
        type: 'docker',
        version: '20',
        description: 'Node.js environment with npm support.',
        dockerImage: 'node:20', // FULL IMAGE
        extension: 'js',
        entryCommand: 'node',
        installCommand: 'npm install --no-save'
      }
    ]
  },

  /* =======================
   * Python
   * ======================= */
  {
    id: 'python',
    name: 'Python',
    prismId: 'python',
    interpreters: [
      {
        id: 'python-docker',
        name: 'Python 3.11',
        type: 'docker',
        version: '3.11',
        description: 'Full Python runtime with pip and system libraries.',
        dockerImage: 'python:3.11', // FULL IMAGE
        extension: 'py',
        entryCommand: 'python3',
        installCommand: 'python3 -m pip install',
        setupCode: `
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

def _nexus_show():
    plt.savefig('output.png')
    print("Saved plot to output.png")

plt.show = _nexus_show
`
      }
    ]
  },

  /* =======================
   * HTML (Browser)
   * ======================= */
  {
    id: 'html',
    name: 'HTML5',
    prismId: 'markup',
    interpreters: [
      {
        id: 'html-browser',
        name: 'Browser Renderer',
        type: 'browser',
        version: 'HTML5',
        description: 'Client-side HTML/CSS/JS renderer.'
      }
    ]
  },

  /* =======================
   * Go
   * ======================= */
  {
    id: 'go',
    name: 'Go',
    prismId: 'go',
    interpreters: [
      {
        id: 'go-docker',
        name: 'Go 1.21',
        type: 'docker',
        version: '1.21',
        description: 'Full Go runtime.',
        dockerImage: 'golang:1.21', // FULL IMAGE
        extension: 'go',
        entryCommand: 'go run',
        installCommand: 'go mod tidy'
      }
    ]
  },

  /* =======================
   * Rust
   * ======================= */
  {
    id: 'rust',
    name: 'Rust',
    prismId: 'rust',
    interpreters: [
      {
        id: 'rust-docker',
        name: 'Rust 1.75',
        type: 'docker',
        version: '1.75',
        description: 'Full Rust runtime with Cargo.',
        dockerImage: 'rust:1.75', // FULL IMAGE
        extension: 'rs',
        entryCommand:
          'rustc /tmp/code.rs -O -o /tmp/main && /tmp/main',
        installCommand: ''
      }
    ]
  },

  /* =======================
   * Ruby
   * ======================= */
  {
    id: 'ruby',
    name: 'Ruby',
    prismId: 'ruby',
    interpreters: [
      {
        id: 'ruby-docker',
        name: 'Ruby 3.2',
        type: 'docker',
        version: '3.2',
        description: 'Full Ruby runtime.',
        dockerImage: 'ruby:3.2', // FULL IMAGE
        extension: 'rb',
        entryCommand: 'ruby',
        installCommand: 'gem install'
      }
    ]
  },

  /* =======================
   * PHP
   * ======================= */
  {
    id: 'php',
    name: 'PHP',
    prismId: 'php',
    interpreters: [
      {
        id: 'php-docker',
        name: 'PHP 8.2',
        type: 'docker',
        version: '8.2',
        description: 'Full PHP CLI runtime.',
        dockerImage: 'php:8.2-cli', // FULL IMAGE
        extension: 'php',
        entryCommand: 'php',
        installCommand: ''
      }
    ]
  }
];

/**
 * =====================================
 * Editor Starter Templates
 * =====================================
 */

export const LANGUAGE_TEMPLATES: Record<string, string> = {
  javascript: `// Node.js Environment
const _ = require('lodash');

console.log("Node version:", process.version);
console.log("Average:", _.mean([10, 20, 30, 40, 50]));
`,

  python: `# Python Environment
import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.plot(x, y)
plt.title("Sine Wave")
plt.show()
`,

  html: `<!DOCTYPE html>
<html>
<body>
  <h1>HTML Runtime Active</h1>
  <button onclick="alert('Clicked!')">Test</button>
</body>
</html>
`,

  go: `package main

import "fmt"

func main() {
  fmt.Println("Go Runtime Active")
}
`,

  rust: `fn main() {
  println!("Rust Runtime Active");
}
`,

  ruby: `puts "Ruby Runtime Active"`,

  php: `<?php
echo "PHP Runtime Active\n";
?>`
};

/**
 * =====================================
 * Editor Theme
 * =====================================
 */

export const EDITOR_THEME = {
  background: 'bg-gray-950',
  gutter: 'bg-gray-900',
  lineNo: 'text-gray-600',
  text: 'text-gray-100',
  cursor: 'border-blue-500'
};