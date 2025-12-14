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
      { id: 'js-ai', name: 'AI Simulator', type: 'cloud', version: 'Latest', description: 'Simulates execution via AI (Visuals supported).' },
      { id: 'js-node', name: 'Node.js Container', type: 'docker', version: 'Node 20', description: 'Real Node.js 20 environment running in Docker.', dockerImage: 'node:20-alpine', extension: 'js', entryCommand: 'node' }
    ]
  },
  { 
    id: 'html', 
    name: 'HTML / CSS', 
    prismId: 'markup', 
    interpreters: [
      { id: 'html-browser', name: 'Browser Renderer', type: 'browser', version: 'HTML5', description: 'Renders HTML/CSS/JS directly in the sandbox.' },
      { id: 'html-ai', name: 'AI Renderer', type: 'cloud', version: 'Latest', description: 'Generates UI/Layouts via AI.' }
    ]
  },
  { 
    id: 'python', 
    name: 'Python', 
    prismId: 'python', 
    interpreters: [
      { id: 'py-ai', name: 'AI Simulator', type: 'cloud', version: 'Latest', description: 'Simulates Python execution. Supports visualization (matplotlib, etc).' },
      { id: 'py-docker', name: 'Python Container', type: 'docker', version: '3.11', description: 'Real Python 3.11 environment in Docker.', dockerImage: 'python:3.11-alpine', extension: 'py', entryCommand: 'python3' }
    ]
  },
  { 
    id: 'typescript', 
    name: 'TypeScript', 
    prismId: 'typescript', 
    interpreters: [
      { id: 'ts-ai', name: 'AI Simulator', type: 'cloud', version: 'Latest', description: 'Simulates TypeScript execution.' },
      { id: 'ts-docker', name: 'TypeScript Container', type: 'docker', version: '5.2', description: 'Compiles and runs TypeScript in Docker.', dockerImage: 'mhart/alpine-node:16', extension: 'ts', entryCommand: 'npx ts-node' }
    ]
  },
  { 
    id: 'go', 
    name: 'Go', 
    prismId: 'go', 
    interpreters: [
      { id: 'go-ai', name: 'AI Simulator', type: 'cloud', version: 'Latest', description: 'Simulates Go execution.' },
      { id: 'go-docker', name: 'Go Container', type: 'docker', version: '1.21', description: 'Go 1.21 environment.', dockerImage: 'golang:1.21-alpine', extension: 'go', entryCommand: 'go run' }
    ]
  },
  { 
    id: 'rust', 
    name: 'Rust', 
    prismId: 'rust', 
    interpreters: [
      { id: 'rust-ai', name: 'AI Simulator', type: 'cloud', version: 'Latest', description: 'Simulates Rust execution.' },
      { id: 'rust-docker', name: 'Rust Container', type: 'docker', version: '1.75', description: 'Compiles and runs Rust code.', dockerImage: 'rust:alpine', extension: 'rs', entryCommand: 'rust-script' }
    ]
  },
  { 
    id: 'cpp', 
    name: 'C++', 
    prismId: 'cpp', 
    interpreters: [
      { id: 'cpp-ai', name: 'AI Simulator', type: 'cloud', version: 'Latest', description: 'Simulates C++ execution.' },
      { id: 'cpp-docker', name: 'GCC Container', type: 'docker', version: 'GCC 12', description: 'Compiles using g++ and executes.', dockerImage: 'frolvlad/alpine-gxx', extension: 'cpp', entryCommand: 'g++ -o /tmp/app /tmp/code.cpp && /tmp/app' }
    ]
  },
  { 
    id: 'java', 
    name: 'Java', 
    prismId: 'java', 
    interpreters: [
      { id: 'java-ai', name: 'AI Simulator', type: 'cloud', version: 'Latest', description: 'Simulates Java execution.' },
      { id: 'java-docker', name: 'OpenJDK Container', type: 'docker', version: '21', description: 'OpenJDK 21 environment.', dockerImage: 'openjdk:21-slim', extension: 'java', entryCommand: 'java' }
    ]
  },
  { 
    id: 'ruby', 
    name: 'Ruby', 
    prismId: 'ruby', 
    interpreters: [
      { id: 'ruby-ai', name: 'AI Simulator', type: 'cloud', version: 'Latest', description: 'Simulates Ruby execution.' },
      { id: 'ruby-docker', name: 'Ruby Container', type: 'docker', version: '3.2', description: 'Ruby 3.2 environment.', dockerImage: 'ruby:3.2-alpine', extension: 'rb', entryCommand: 'ruby' }
    ]
  },
  { 
    id: 'php', 
    name: 'PHP', 
    prismId: 'php', 
    interpreters: [
      { id: 'php-ai', name: 'AI Simulator', type: 'cloud', version: 'Latest', description: 'Simulates PHP execution.' },
      { id: 'php-docker', name: 'PHP CLI', type: 'docker', version: '8.2', description: 'PHP 8.2 CLI environment.', dockerImage: 'php:8.2-cli-alpine', extension: 'php', entryCommand: 'php' }
    ]
  },
  { 
    id: 'bash', 
    name: 'Bash', 
    prismId: 'bash', 
    interpreters: [
      { id: 'bash-ai', name: 'AI Simulator', type: 'cloud', version: 'Latest', description: 'Simulates Bash execution.' },
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
  javascript: `console.log("Hello from JavaScript!");
const data = [10, 25, 40, 35, 20];
console.log("Data:", data);

// If using Browser Runtime, this works:
if (typeof document !== 'undefined') {
  const div = document.createElement('div');
  div.innerText = "DOM Manipulation Works!";
  div.style.color = 'salmon';
  document.body.appendChild(div);
}
`,
  html: `<h1>Browser Renderer</h1>
<style>
  button { padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; }
</style>
<button onclick="alert('Clicked!')">Click Me</button>
<div id="output"></div>
<script>
  console.log("Inline script working");
</script>
`,
  python: `# Python Mode
# Use AI Simulator to run without installation
# Use Docker for exact environment

import random

# Calculate squares
data = [x**2 for x in range(10)]
print("Squares:", data)

# Visualization (Works in AI Simulator)
# import matplotlib.pyplot as plt
# plt.plot(data)
# plt.title("Square Numbers")
# plt.show()
`,
  typescript: `interface User {
  id: number;
  name: string;
  role: 'admin' | 'user';
}

const user: User = { 
  id: 1, 
  name: "Nexus User",
  role: 'admin' 
};

console.log("Active User:", user);
`,
  go: `package main

import "fmt"

func main() {
	fmt.Println("Hello from Go!")
	
	numbers := []int{1, 2, 3, 4, 5}
	sum := 0
	for _, n := range numbers {
		sum += n
	}
	fmt.Printf("Sum: %d\\n", sum)
}
`,
  rust: `fn main() {
    println!("Hello from Rust!");
    
    let numbers = vec![1, 2, 3, 4, 5];
    let sum: i32 = numbers.iter().sum();
    
    println!("Sum: {}", sum);
}
`,
  cpp: `#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "Hello from C++!" << std::endl;
    
    std::vector<int> v = {1, 2, 3, 4, 5};
    int sum = std::accumulate(v.begin(), v.end(), 0);
    
    std::cout << "Sum: " << sum << std::endl;
    return 0;
}
`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
        
        int[] numbers = {1, 2, 3, 4, 5};
        int sum = 0;
        for (int n : numbers) {
            sum += n;
        }
        
        System.out.println("Sum: " + sum);
    }
}
`,
  ruby: `puts "Hello from Ruby!"

numbers = [1, 2, 3, 4, 5]
sum = numbers.sum

puts "Sum: #{sum}"
`,
  php: `<?php
echo "Hello from PHP!\n";

$numbers = [1, 2, 3, 4, 5];
$sum = array_sum($numbers);

echo "Sum: " . $sum . "\n";
?>
`,
  bash: `echo "Hello from Bash!"
echo "Current Date: $(date)"
echo "Generating sequence:"
seq 1 5
`
};

export const EDITOR_THEME = {
  background: 'bg-gray-950',
  gutter: 'bg-gray-900',
  lineNo: 'text-gray-600',
  text: 'text-gray-100',
  cursor: 'border-blue-500',
};