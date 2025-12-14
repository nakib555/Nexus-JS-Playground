import { Language } from './types';

export const LANGUAGES: Language[] = [
  { 
    id: 'javascript', 
    name: 'JavaScript', 
    prismId: 'javascript', 
    interpreters: [
      { id: 'js-v8', name: 'Browser Runtime', type: 'browser', version: 'ESNext', description: 'Executes locally in the browser. Supports DOM and Web APIs.' },
      { id: 'js-ai', name: 'AI Universal', type: 'ai', version: 'Gemini 3.0', description: 'Runs any JS code with simulated standard libraries.' },
      { id: 'js-node', name: 'Node.js Container', type: 'docker', version: 'Node 20', description: 'Real Node.js 20 environment running in Docker.', dockerImage: 'node:20-alpine', extension: 'js', entryCommand: 'node' }
    ]
  },
  { 
    id: 'python', 
    name: 'Python', 
    prismId: 'python', 
    interpreters: [
      { id: 'py-ai', name: 'AI Universal', type: 'ai', version: 'Gemini 3.0', description: 'Runs any Python code. Simulates matplotlib, pandas, etc.' },
      { id: 'py-docker', name: 'Python Container', type: 'docker', version: '3.11', description: 'Real Python 3.11 environment in Docker.', dockerImage: 'python:3.11-alpine', extension: 'py', entryCommand: 'python3' }
    ]
  },
  { 
    id: 'html', 
    name: 'HTML / CSS', 
    prismId: 'markup', 
    interpreters: [
      { id: 'html-browser', name: 'Browser Renderer', type: 'browser', version: 'HTML5', description: 'Renders HTML/CSS/JS directly in the sandbox.' },
      { id: 'html-ai', name: 'AI Preview', type: 'ai', version: 'Gemini 3.0', description: 'Generates and improves HTML layouts via AI.' }
    ]
  },
  { 
    id: 'typescript', 
    name: 'TypeScript', 
    prismId: 'typescript', 
    interpreters: [
      { id: 'ts-ai', name: 'AI Universal', type: 'ai', version: 'Gemini 3.0', description: 'Simulates TypeScript execution with type checking logic.' },
      { id: 'ts-docker', name: 'TypeScript Container', type: 'docker', version: '5.2', description: 'Compiles and runs TypeScript in Docker.', dockerImage: 'mhart/alpine-node:16', extension: 'ts', entryCommand: 'npx ts-node' }
    ]
  },
  { 
    id: 'go', 
    name: 'Go', 
    prismId: 'go', 
    interpreters: [
      { id: 'go-ai', name: 'AI Universal', type: 'ai', version: 'Gemini 3.0', description: 'Simulates Go execution via AI.' },
      { id: 'go-docker', name: 'Go Container', type: 'docker', version: '1.21', description: 'Go 1.21 environment.', dockerImage: 'golang:1.21-alpine', extension: 'go', entryCommand: 'go run' }
    ]
  },
  { 
    id: 'rust', 
    name: 'Rust', 
    prismId: 'rust', 
    interpreters: [
      { id: 'rust-ai', name: 'AI Universal', type: 'ai', version: 'Gemini 3.0', description: 'Simulates Rust execution via AI.' },
      { id: 'rust-docker', name: 'Rust Container', type: 'docker', version: '1.75', description: 'Compiles and runs Rust code.', dockerImage: 'rust:alpine', extension: 'rs', entryCommand: 'rust-script' }
    ]
  },
  { 
    id: 'cpp', 
    name: 'C++', 
    prismId: 'cpp', 
    interpreters: [
      { id: 'cpp-ai', name: 'AI Universal', type: 'ai', version: 'Gemini 3.0', description: 'Simulates C++ execution via AI.' },
      { id: 'cpp-docker', name: 'GCC Container', type: 'docker', version: 'GCC 12', description: 'Compiles using g++ and executes.', dockerImage: 'frolvlad/alpine-gxx', extension: 'cpp', entryCommand: 'g++ -o /tmp/app /tmp/code.cpp && /tmp/app' }
    ]
  },
  { 
    id: 'java', 
    name: 'Java', 
    prismId: 'java', 
    interpreters: [
      { id: 'java-ai', name: 'AI Universal', type: 'ai', version: 'Gemini 3.0', description: 'Simulates Java execution via AI.' },
      { id: 'java-docker', name: 'OpenJDK Container', type: 'docker', version: '21', description: 'OpenJDK 21 environment.', dockerImage: 'openjdk:21-slim', extension: 'java', entryCommand: 'java' }
    ]
  },
  { 
    id: 'ruby', 
    name: 'Ruby', 
    prismId: 'ruby', 
    interpreters: [
      { id: 'ruby-ai', name: 'AI Universal', type: 'ai', version: 'Gemini 3.0', description: 'Simulates Ruby execution via AI.' },
      { id: 'ruby-docker', name: 'Ruby Container', type: 'docker', version: '3.2', description: 'Ruby 3.2 environment.', dockerImage: 'ruby:3.2-alpine', extension: 'rb', entryCommand: 'ruby' }
    ]
  },
  { 
    id: 'php', 
    name: 'PHP', 
    prismId: 'php', 
    interpreters: [
      { id: 'php-ai', name: 'AI Universal', type: 'ai', version: 'Gemini 3.0', description: 'Simulates PHP execution via AI.' },
      { id: 'php-docker', name: 'PHP CLI', type: 'docker', version: '8.2', description: 'PHP 8.2 CLI environment.', dockerImage: 'php:8.2-cli-alpine', extension: 'php', entryCommand: 'php' }
    ]
  },
  { 
    id: 'bash', 
    name: 'Bash', 
    prismId: 'bash', 
    interpreters: [
      { id: 'bash-ai', name: 'AI Universal', type: 'ai', version: 'Gemini 3.0', description: 'Simulates Bash execution via AI.' },
      { id: 'bash-docker', name: 'Shell Container', type: 'docker', version: 'Alpine', description: 'Alpine Linux Shell.', dockerImage: 'alpine:latest', extension: 'sh', entryCommand: 'sh' }
    ]
  }
];

export const LANGUAGE_TEMPLATES: Record<string, string> = {
  javascript: `console.log("Hello from Nexus!");

// Example: Simulating complex logic
function fibonacci(n) {
  return n < 1 ? 0 : n <= 2 ? 1 : fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci(10):", fibonacci(10));

// Example: Visual Output (AI Mode can simulate charts)
// When running in AI Mode, this will generate a real chart.
/* 
   const ctx = document.createElement('canvas').getContext('2d');
   // ... drawing logic ...
*/
`,
  html: `<!-- 
  Universal HTML Renderer 
  Supports Tailwind CSS via CDN automatically
-->
<div class="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-10">
  <div class="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
    Nexus Preview
  </div>
  <p class="text-slate-400 text-lg mb-8">
    Edit this code to see live updates.
  </p>
  <button class="px-6 py-3 bg-blue-600 rounded-full hover:bg-blue-500 transition-all shadow-lg hover:shadow-blue-500/50">
    Interactive Button
  </button>
</div>
`,
  python: `# Universal Python Runner
# Use AI Mode to simulate libraries like matplotlib, numpy, or pandas without installation.

import numpy as np
import matplotlib.pyplot as plt

# 1. Standard Output
print("Generating Data Visualization...")
x = np.linspace(0, 10, 100)
y = np.sin(x)

print(f"Computed {len(x)} points.")

# 2. Visual Output (AI will render this as an SVG/Image)
plt.figure(figsize=(8, 4))
plt.plot(x, y, label='Sine Wave', color='#6366f1', linewidth=2)
plt.title('AI Simulated Plotting')
plt.grid(True, alpha=0.3)
plt.legend()
plt.show()
`,
  typescript: `interface User {
  id: number;
  name: string;
  role: 'admin' | 'user';
  active: boolean;
}

const users: User[] = [
  { id: 1, name: "Alice", role: 'admin', active: true },
  { id: 2, name: "Bob", role: 'user', active: false },
  { id: 3, name: "Charlie", role: 'user', active: true },
];

// AI Runner handles console.table beautifully
console.table(users);

const activeUsers = users.filter(u => u.active);
console.log(\`Found \${activeUsers.length} active users.\`);
`,
  go: `package main

import (
	"fmt"
	"time"
)

func main() {
	fmt.Println("Starting Goroutines Simulation...")
	
	c := make(chan string)
	
	go count("sheep", c)
	
	for msg := range c {
		fmt.Println(msg)
	}
}

func count(thing string, c chan string) {
	for i := 1; i <= 3; i++ {
		c <- fmt.Sprintf("Counted %d %s", i, thing)
		time.Sleep(time.Millisecond * 500)
	}
	close(c)
}
`,
  rust: `fn main() {
    println!("Rust Ownership Example");
    
    let s1 = String::from("Nexus");
    let s2 = s1; // Ownership moved
    
    // println!("{}", s1); // This would error!
    println!("Moved ownership to: {}", s2);
    
    let numbers = vec![1, 2, 3, 4, 5];
    let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();
    
    println!("Doubled: {:?}", doubled);
}
`,
  cpp: `#include <iostream>
#include <vector>
#include <algorithm>
#include <string>

struct Student {
    std::string name;
    int score;
};

int main() {
    std::vector<Student> classA = {
        {"Alice", 92},
        {"Bob", 78},
        {"Charlie", 88}
    };
    
    std::cout << "Class Roster:" << std::endl;
    for (const auto& s : classA) {
        std::cout << "- " << s.name << ": " << s.score << std::endl;
    }
    
    auto topStudent = std::max_element(classA.begin(), classA.end(), 
        [](const Student& a, const Student& b) {
            return a.score < b.score;
        });
        
    std::cout << "\nTop Student: " << topStudent->name << std::endl;
    
    return 0;
}
`,
  java: `import java.util.stream.IntStream;

public class Main {
    public static void main(String[] args) {
        System.out.println("Java Stream API Simulation");
        
        System.out.println("Even numbers > 50:");
        IntStream.range(1, 100)
                 .filter(n -> n % 2 == 0)
                 .filter(n -> n > 50)
                 .limit(5)
                 .forEach(System.out::println);
                 
        System.out.println("\nExecution Complete.");
    }
}
`,
  ruby: `puts "Ruby Metaprogramming Magic"

class Developer
  define_method :code do |lang|
    puts "Writing nice #{lang} code..."
  end
end

dev = Developer.new
dev.code("Ruby")
dev.code("JavaScript")

puts "\nArray Operations:"
puts [1, 2, 3, 4, 5].select { |n| n.even? }.map { |n| n * 10 }.inspect
`,
  php: `<?php
echo "PHP Modern Features\n";

$users = [
    ['name' => 'Alice', 'role' => 'admin'],
    ['name' => 'Bob', 'role' => 'editor'],
];

// Arrow functions
$admins = array_filter($users, fn($u) => $u['role'] === 'admin');

print_r($admins);

echo "\nDate: " . date('Y-m-d H:i:s');
?>
`,
  bash: `echo "System Report"
echo "-------------"
echo "User: $(whoami)"
echo "Kernel: $(uname -r)"
echo "Uptime: $(uptime)"

echo "\nDisk Usage Simulation:"
echo "Filesystem      Size  Used Avail Use% Mounted on"
echo "/dev/sda1       100G   45G   55G  45% /"
`
};

export const EDITOR_THEME = {
  background: 'bg-gray-950',
  gutter: 'bg-gray-900',
  lineNo: 'text-gray-600',
  text: 'text-gray-100',
  cursor: 'border-blue-500',
};