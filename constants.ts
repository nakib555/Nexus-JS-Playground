import { Language } from './types';

/**
 * ===============================
 * Language Runtime Definitions
 * ===============================
 * All Docker images & install commands
 * are verified to work correctly.
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
        version: '20-alpine',
        description: 'Node.js environment with npm support.',
        dockerImage: 'node:20-alpine',
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
        description: 'Standard Python environment. Supports pip.',
        dockerImage: 'python:3.11-slim',
        extension: 'py',
        entryCommand: 'python3',
        installCommand: 'python3 -m pip install',
        setupCode: `
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    def _nexus_show():
        plt.savefig('output.png')
        print("Saved plot to output.png")

    plt.show = _nexus_show
except ImportError:
    pass
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
        description: 'Go runtime.',
        dockerImage: 'golang:1.21-alpine',
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
        description: 'Rust runtime with Cargo support.',
        dockerImage: 'rust:1.75-alpine',
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
        description: 'Ruby runtime.',
        dockerImage: 'ruby:3.2-alpine',
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
        description: 'PHP CLI.',
        dockerImage: 'php:8.2-cli-alpine',
        extension: 'php',
        entryCommand: 'php',
        installCommand: ''
      }
    ]
  }
];

/**
 * ===============================
 * Editor Starter Templates
 * ===============================
 */

export const LANGUAGE_TEMPLATES: Record<string, string> = {
  javascript: `// Node.js Environment
// Import any library! Libraries will be auto-installed.

const _ = require('lodash');
const fs = require('fs');

console.log("Hello from Node.js " + process.version);

const numbers = [10, 20, 30, 40, 50];
console.log("Average:", _.mean(numbers));

fs.writeFileSync(
  'output.json',
  JSON.stringify({ status: 'active', data: numbers }, null, 2)
);

console.log("Generated output.json");
`,

  python: `# Python Environment
# Import ANY library - it will be auto-installed!

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

print("Generating Data...")
x = np.linspace(0, 10, 100)
y = np.sin(x)

df = pd.DataFrame({'x': x, 'y': y})
print(df.head())

print("Plotting...")
plt.figure(figsize=(10, 6))
plt.plot(x, y, label='Sine Wave')
plt.title("Generated Plot")
plt.legend()
plt.grid(True)
plt.show()
`,

  html: `<!-- Browser Renderer -->
<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#020617;color:white;">
  <div style="text-align:center">
    <h1>Nexus Web</h1>
    <p>Client-side execution active.</p>
    <button onclick="alert('Clicked!')">Test Interaction</button>
  </div>
</div>
`,

  go: `package main

import (
  "fmt"
  "time"
)

func main() {
  fmt.Println("Go Runtime Active")

  for i := 1; i <= 3; i++ {
    fmt.Println("Counting", i)
    time.Sleep(500 * time.Millisecond)
  }
}
`,

  rust: `fn main() {
  println!("Rust Runtime Active");

  let nums = vec![1, 2, 3, 4, 5];
  let doubled: Vec<i32> = nums.iter().map(|x| x * 2).collect();

  println!("Doubled: {:?}", doubled);
}
`,

  ruby: `require 'json'

puts "Ruby Runtime Active"

data = { name: "Nexus", status: "Online" }
puts JSON.pretty_generate(data)
`,

  php: `<?php
echo "PHP Runtime Active\n";

$data = ["Apple", "Banana", "Cherry"];
print_r($data);
?>
`
};

/**
 * ===============================
 * Editor Theme
 * ===============================
 */

export const EDITOR_THEME = {
  background: 'bg-gray-950',
  gutter: 'bg-gray-900',
  lineNo: 'text-gray-600',
  text: 'text-gray-100',
  cursor: 'border-blue-500'
};