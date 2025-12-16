import { Language } from './types';

/**
 * =====================================
 * Language Runtime Definitions
 * Using Optimized Docker images (Slim/Alpine)
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
        id: 'node-20-slim',
        name: 'Node.js 20 (Slim)',
        type: 'docker',
        version: 'v20.x',
        description: 'Latest LTS (Lightweight)',
        dockerImage: 'node:20-slim',
        extension: 'js',
        entryCommand: 'node',
        installCommand: 'npm install --no-save'
      },
      {
        id: 'node-18-alpine',
        name: 'Node.js 18 (Alpine)',
        type: 'docker',
        version: 'v18.x',
        description: 'Previous LTS (Minimal)',
        dockerImage: 'node:18-alpine',
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
        id: 'python-3.11-slim',
        name: 'Python 3.11 (Slim)',
        type: 'docker',
        version: '3.11',
        description: 'Optimized Standard Runtime',
        dockerImage: 'python:3.11-slim',
        extension: 'py',
        entryCommand: 'python',
        installCommand: 'pip install --no-cache-dir',
        setupCode: `
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

def _nexus_show():
    plt.savefig('output.png')
    print("Saved plot to output.png")

plt.show = _nexus_show
`
      },
      {
        id: 'python-3.9-alpine',
        name: 'Python 3.9 (Alpine)',
        type: 'docker',
        version: '3.9',
        description: 'Legacy Minimal Runtime',
        dockerImage: 'python:3.9-alpine',
        extension: 'py',
        entryCommand: 'python',
        installCommand: 'pip install --no-cache-dir'
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
        id: 'go-1.21-alpine',
        name: 'Go 1.21 (Alpine)',
        type: 'docker',
        version: '1.21',
        description: 'Lightweight Go Runtime',
        dockerImage: 'golang:1.21-alpine',
        extension: 'go',
        entryCommand: 'go run',
        installCommand: 'go mod tidy'
      },
      {
        id: 'go-1.19',
        name: 'Go 1.19',
        type: 'docker',
        version: '1.19',
        description: 'Legacy Go Runtime',
        dockerImage: 'golang:1.19-alpine',
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
        version: '1.75 (Slim)',
        description: 'Rust runtime with Cargo.',
        dockerImage: 'rust:1.75-slim',
        extension: 'rs',
        entryCommand:
          'rustc /workspace/code.rs -O -o /workspace/main && /workspace/main',
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
        version: '3.2 (Slim)',
        description: 'Optimized Ruby runtime.',
        dockerImage: 'ruby:3.2-slim',
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
        version: '8.2 (CLI)',
        description: 'PHP CLI runtime.',
        dockerImage: 'php:8.2-cli-alpine',
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