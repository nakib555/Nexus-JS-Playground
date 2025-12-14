import { Language } from './types';

export const LANGUAGES: Language[] = [
  { 
    id: 'universal', 
    name: 'Universal / Pseudocode', 
    prismId: 'markdown', 
    interpreters: [
      { id: 'uni-ai', name: 'Universal AI Runner', type: 'cloud', version: 'Latest', description: 'Executes any code, pseudocode, or algorithms via LLM simulation.' }
    ]
  },
  { 
    id: 'javascript', 
    name: 'JavaScript', 
    prismId: 'javascript', 
    interpreters: [
      { id: 'js-v8', name: 'Browser Runtime', type: 'browser', version: 'ESNext', description: 'Executes locally in the browser. Supports DOM and Web APIs.' },
      { id: 'js-node', name: 'Node.js Container', type: 'docker', version: 'Node 20', description: 'Real Node.js 20 environment running in Docker.', dockerImage: 'node:20-alpine', extension: 'js', entryCommand: 'node' }
    ]
  },
  { 
    id: 'html', 
    name: 'HTML / CSS', 
    prismId: 'markup', 
    interpreters: [
      { id: 'html-browser', name: 'Browser Renderer', type: 'browser', version: 'HTML5', description: 'Renders HTML/CSS/JS directly in the sandbox.' }
    ]
  },
  { 
    id: 'python', 
    name: 'Python', 
    prismId: 'python', 
    interpreters: [
      { id: 'py-docker', name: 'Python Container', type: 'docker', version: '3.11', description: 'Real Python 3.11 environment in Docker.', dockerImage: 'python:3.11-alpine', extension: 'py', entryCommand: 'python3' }
    ]
  },
  { 
    id: 'typescript', 
    name: 'TypeScript', 
    prismId: 'typescript', 
    interpreters: [
      // Uses ts-node in a node container
      { id: 'ts-docker', name: 'TypeScript Container', type: 'docker', version: '5.2', description: 'Compiles and runs TypeScript in Docker.', dockerImage: 'mhart/alpine-node:16', extension: 'ts', entryCommand: 'npx ts-node' }
    ]
  },
  { 
    id: 'go', 
    name: 'Go', 
    prismId: 'go', 
    interpreters: [
      { id: 'go-docker', name: 'Go Container', type: 'docker', version: '1.21', description: 'Go 1.21 environment.', dockerImage: 'golang:1.21-alpine', extension: 'go', entryCommand: 'go run' }
    ]
  },
  { 
    id: 'rust', 
    name: 'Rust', 
    prismId: 'rust', 
    interpreters: [
      { id: 'rust-docker', name: 'Rust Container', type: 'docker', version: '1.75', description: 'Compiles and runs Rust code.', dockerImage: 'rust:alpine', extension: 'rs', entryCommand: 'rust-script' }
    ]
  },
  { 
    id: 'cpp', 
    name: 'C++', 
    prismId: 'cpp', 
    interpreters: [
      { id: 'cpp-docker', name: 'GCC Container', type: 'docker', version: 'GCC 12', description: 'Compiles using g++ and executes.', dockerImage: 'frolvlad/alpine-gxx', extension: 'cpp', entryCommand: 'g++ -o /tmp/app /tmp/code.cpp && /tmp/app' }
    ]
  },
  { 
    id: 'java', 
    name: 'Java', 
    prismId: 'java', 
    interpreters: [
      { id: 'java-docker', name: 'OpenJDK Container', type: 'docker', version: '21', description: 'OpenJDK 21 environment.', dockerImage: 'openjdk:21-slim', extension: 'java', entryCommand: 'java' }
    ]
  },
  { 
    id: 'ruby', 
    name: 'Ruby', 
    prismId: 'ruby', 
    interpreters: [
      { id: 'ruby-docker', name: 'Ruby Container', type: 'docker', version: '3.2', description: 'Ruby 3.2 environment.', dockerImage: 'ruby:3.2-alpine', extension: 'rb', entryCommand: 'ruby' }
    ]
  },
  { 
    id: 'php', 
    name: 'PHP', 
    prismId: 'php', 
    interpreters: [
      { id: 'php-docker', name: 'PHP CLI', type: 'docker', version: '8.2', description: 'PHP 8.2 CLI environment.', dockerImage: 'php:8.2-cli-alpine', extension: 'php', entryCommand: 'php' }
    ]
  },
  { 
    id: 'bash', 
    name: 'Bash', 
    prismId: 'bash', 
    interpreters: [
      { id: 'bash-docker', name: 'Shell Container', type: 'docker', version: 'Alpine', description: 'Alpine Linux Shell.', dockerImage: 'alpine:latest', extension: 'sh', entryCommand: 'sh' }
    ]
  }
];

export const LANGUAGE_TEMPLATES: Record<string, string> = {
  universal: `// Universal AI Mode
// Describe what you want to calculate or visualize.
// The AI will interpret this and generate output.

Sort a list of 20 random numbers and plot them as a bar chart.
`,
  javascript: `console.log("Hello from Dockerized Node.js!");
console.log("Node Version:", process.version);
const os = require('os');
console.log("Hostname:", os.hostname());
`,
  html: `<h1>Local Browser Renderer</h1>
<button onclick="alert('Clicked!')">Click Me</button>
`,
  python: `import sys
import platform

print(f"Hello from Docker! Python {platform.python_version()}")
print(f"Running on: {sys.platform}")

# Simple calculation
data = [x**2 for x in range(10)]
print("Squares:", data)
`,
  typescript: `interface User {
  id: number;
  name: string;
}

const user: User = { id: 1, name: "Docker TS" };
console.log("User:", user);
`,
  go: `package main

import (
	"fmt"
	"runtime"
)

func main() {
	fmt.Printf("Hello from Go running in Docker!\n")
	fmt.Printf("OS: %s\n", runtime.GOOS)
	fmt.Printf("Arch: %s\n", runtime.GOARCH)
}
`,
  rust: `fn main() {
    println!("Hello from Rust Container!");
    let x = 42;
    println!("The answer is {}", x);
}
`,
  cpp: `#include <iostream>
#include <vector>

int main() {
    std::cout << "Hello from C++ Container!" << std::endl;
    std::vector<int> v = {1, 2, 3, 4, 5};
    for(int i : v) {
        std::cout << i << " ";
    }
    std::cout << std::endl;
    return 0;
}
`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from OpenJDK Container!");
        System.out.println("Java Version: " + System.getProperty("java.version"));
    }
}
`,
  ruby: `puts "Hello from Ruby Container!"
puts "Ruby Version: #{RUBY_VERSION}"
`,
  php: `<?php
echo "Hello from PHP Container!\n";
echo "PHP Version: " . phpversion() . "\n";
?>
`,
  bash: `echo "Hello from Alpine Linux!"
echo "Current User: $(whoami)"
echo "Filesystem:"
ls -la /
`
};

export const EDITOR_THEME = {
  background: 'bg-gray-950',
  gutter: 'bg-gray-900',
  lineNo: 'text-gray-600',
  text: 'text-gray-100',
  cursor: 'border-blue-500',
};