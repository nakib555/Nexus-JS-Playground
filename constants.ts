import { Language } from './types';

export const LANGUAGES: Language[] = [
  { 
    id: 'universal', 
    name: 'Universal / Pseudocode', 
    prismId: 'markdown', 
    interpreters: [
      { id: 'uni-ai', name: 'Universal AI Runner', type: 'cloud', version: 'Latest', description: 'Executes any code, pseudocode, or algorithms in any language. Supports mixed visual and text output.' }
    ]
  },
  { 
    id: 'javascript', 
    name: 'JavaScript', 
    prismId: 'javascript', 
    interpreters: [
      { id: 'js-v8', name: 'Browser Engine (V8)', type: 'browser', version: 'ESNext', description: 'Executes locally in your browser context. Supports DOM manipulation.' },
      { id: 'js-node', name: 'Node.js Simulator', type: 'cloud', version: 'v20.x', description: 'Simulates a server-side Node.js environment.' }
    ]
  },
  { 
    id: 'html', 
    name: 'HTML / CSS', 
    prismId: 'markup', 
    interpreters: [
      { id: 'html-browser', name: 'Browser Renderer', type: 'browser', version: 'HTML5', description: 'Renders HTML and CSS directly in the visual sandbox.' }
    ]
  },
  { 
    id: 'typescript', 
    name: 'TypeScript', 
    prismId: 'typescript', 
    interpreters: [
      { id: 'ts-node', name: 'TypeScript Runtime', type: 'cloud', version: '5.3', description: 'Executes TypeScript via Node.js simulation.' }
    ]
  },
  { 
    id: 'python', 
    name: 'Python', 
    prismId: 'python', 
    interpreters: [
      { id: 'py-3', name: 'Python 3 Runtime', type: 'cloud', version: '3.12', description: 'Standard Python interpreter via Cloud simulation.' }
    ]
  },
  { 
    id: 'java', 
    name: 'Java', 
    prismId: 'java', 
    interpreters: [
      { id: 'java-21', name: 'OpenJDK', type: 'cloud', version: '21', description: 'Java SE 21 environment.' }
    ]
  },
  { 
    id: 'csharp', 
    name: 'C#', 
    prismId: 'csharp', 
    interpreters: [
      { id: 'dotnet-8', name: '.NET Core', type: 'cloud', version: '8.0', description: 'C# execution on .NET 8 runtime.' }
    ]
  },
  { 
    id: 'cpp', 
    name: 'C++', 
    prismId: 'cpp', 
    interpreters: [
      { id: 'gcc-13', name: 'GCC', type: 'cloud', version: '13.2', description: 'GNU Compiler Collection.' }
    ]
  },
  { 
    id: 'go', 
    name: 'Go', 
    prismId: 'go', 
    interpreters: [
      { id: 'go-1', name: 'Go Runtime', type: 'cloud', version: '1.22', description: 'Standard Go compiler and runner.' }
    ]
  },
  { 
    id: 'rust', 
    name: 'Rust', 
    prismId: 'rust', 
    interpreters: [
      { id: 'rust-c', name: 'Cargo / Rustc', type: 'cloud', version: '1.75', description: 'Official Rust compiler.' }
    ]
  },
  { 
    id: 'ruby', 
    name: 'Ruby', 
    prismId: 'ruby', 
    interpreters: [
      { id: 'ruby-3', name: 'Ruby MRI', type: 'cloud', version: '3.3', description: 'Standard Ruby interpreter.' }
    ]
  },
  { 
    id: 'php', 
    name: 'PHP', 
    prismId: 'php', 
    interpreters: [
      { id: 'php-8', name: 'PHP CLI', type: 'cloud', version: '8.3', description: 'PHP command line interface.' }
    ]
  },
  { 
    id: 'swift', 
    name: 'Swift', 
    prismId: 'swift', 
    interpreters: [
      { id: 'swift-5', name: 'Swift CLI', type: 'cloud', version: '5.9', description: 'Swift programming language.' }
    ]
  },
  { 
    id: 'bash', 
    name: 'Bash', 
    prismId: 'bash', 
    interpreters: [
      { id: 'bash-shell', name: 'Shell', type: 'cloud', version: '5.2', description: 'Unix shell environment.' }
    ]
  },
  { 
    id: 'sql', 
    name: 'SQL', 
    prismId: 'sql', 
    interpreters: [
      { id: 'sqlite', name: 'SQLite', type: 'cloud', version: '3.44', description: 'In-memory SQLite database.' }
    ]
  },
];

export const LANGUAGE_TEMPLATES: Record<string, string> = {
  universal: `// Universal Execution Mode
// Write code in ANY language, or even pseudocode.
// The AI will interpret it, run it, and show you the output.
// It can handle mixed text and visual output (like plots).

Python:
import matplotlib.pyplot as plt
import numpy as np

# Generate data
x = np.linspace(0, 10, 100)
y = np.sin(x)

# Print some text output
print(f"Generating Sine Wave for {len(x)} points...")
print("Peak value:", np.max(y))

# Create the plot
plt.figure(figsize=(8, 4))
plt.plot(x, y, label='sin(x)', color='purple', linewidth=2)
plt.title('Nexus Universal Renderer')
plt.grid(True, alpha=0.3)
plt.legend()

# Show it (Nexus will render this as SVG)
plt.show()
`,
  javascript: `// Welcome to Nexus Playground
// Interpreter: Selected Runtime

console.log("System initialized.");

// If in Browser Mode, we can use DOM
if (typeof document !== 'undefined' && typeof root !== 'undefined') {
    const card = document.createElement('div');
    Object.assign(card.style, {
      padding: '2rem',
      background: 'linear-gradient(135deg, #6366f1, #a855f7)',
      borderRadius: '1rem',
      color: 'white',
      fontFamily: 'sans-serif',
      boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.5)',
      cursor: 'pointer',
      transition: 'transform 0.2s'
    });
    
    card.innerHTML = \`
      <h2 style="margin:0 0 0.5rem 0">Hello World</h2>
      <p style="margin:0; opacity:0.9">Click me!</p>
    \`;
    
    card.onclick = () => {
      console.log("Interaction detected");
      card.style.transform = 'scale(0.95)';
      setTimeout(() => card.style.transform = 'scale(1)', 100);
    };
    
    root.appendChild(card);
}
`,
  html: `<!-- Nexus HTML Playground -->
<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-family: 'Inter', sans-serif;
    color: #333;
  }
  .dark .container { color: #fff; }
  
  .btn {
    margin-top: 20px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    border: none;
    border-radius: 99px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    transition: transform 0.2s;
  }
  .btn:active { transform: scale(0.95); }
</style>

<div class="container">
  <h1 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; text-align: center;">
    <span style="background-clip: text; -webkit-background-clip: text; color: transparent; background-image: linear-gradient(to right, #ec4899, #8b5cf6, #3b82f6);">
      Visual Output
    </span>
  </h1>
  <p style="opacity: 0.7;">Write standard HTML, CSS, and JS here.</p>
  
  <button class="btn" onclick="handleClick()">Interactive Element</button>
  
  <div id="counter" style="margin-top: 15px; font-mono: true; opacity: 0.5;">Count: 0</div>
</div>

<script>
  let count = 0;
  function handleClick() {
    count++;
    const el = document.getElementById('counter');
    el.innerText = 'Count: ' + count;
    el.style.opacity = '1';
    console.log('Button clicked! New count: ' + count);
  }
</script>
`,
  typescript: `// Nexus TypeScript Playground
// Interpreter: Node.js (Simulated)

interface User {
  id: number;
  name: string;
  role: 'admin' | 'user';
}

const users: User[] = [
  { id: 1, name: "Alice", role: "admin" },
  { id: 2, name: "Bob", role: "user" }
];

function getAdmins(list: User[]): User[] {
  return list.filter(u => u.role === 'admin');
}

console.log("Found admins:", getAdmins(users));
`,
  python: `# Nexus Python Playground
# Interpreter: Python 3.12

import random

# Mixed Output Example: Text + Visual
print("Analyzing random distribution...")
data = [random.gauss(0, 1) for _ in range(100)]
print(f"Min: {min(data):.2f}, Max: {max(data):.2f}")

# The AI Runner can simulate matplotlib and return SVG!
print("Generating histogram plot...")
# Imagine code here: import matplotlib.pyplot as plt...
`,
  java: `// Nexus Java Playground
// Interpreter: OpenJDK 21

public class Main {
    public static void main(String[] args) {
        System.out.println("Initializing Java Runtime...");
        
        Person p = new Person("Nexus User");
        p.greet();
    }
}

class Person {
    private String name;
    
    public Person(String name) {
        this.name = name;
    }
    
    public void greet() {
        System.out.println("Hello from " + this.name + "!");
    }
}
`,
  csharp: `// Nexus C# Playground
// Interpreter: .NET 8.0

using System;
using System.Linq;

public class Program
{
    public static void Main()
    {
        Console.WriteLine("C# LINQ Example");
        
        var numbers = new[] { 1, 5, 2, 8, 9, 3 };
        
        var evenSquares = numbers
            .Where(n => n % 2 == 0)
            .Select(n => n * n)
            .ToList();
            
        Console.WriteLine($"Original: {string.Join(", ", numbers)}");
        Console.WriteLine($"Even Squares: {string.Join(", ", evenSquares)}");
    }
}
`,
  cpp: `// Nexus C++ Playground
// Interpreter: GCC 13

#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::cout << "Starting C++ Vector Operations..." << std::endl;
    
    std::vector<int> numbers = {5, 2, 8, 1, 9};
    
    std::cout << "Original: ";
    for(int n : numbers) std::cout << n << " ";
    std::cout << std::endl;
    
    std::sort(numbers.begin(), numbers.end());
    
    std::cout << "Sorted:   ";
    for(int n : numbers) std::cout << n << " ";
    std::cout << std::endl;
    
    return 0;
}
`,
  go: `// Nexus Go Playground
// Interpreter: Go 1.22

package main

import (
	"fmt"
	"time"
)

func main() {
	fmt.Println("Go Routine Simulation")
	
	c := make(chan string)
	
	go func() {
		time.Sleep(100 * time.Millisecond)
		c <- "Processed data from routine"
	}()
	
	fmt.Println("Waiting...")
	msg := <-c
	fmt.Println(msg)
	fmt.Println("Done")
}
`,
  rust: `// Nexus Rust Playground
// Interpreter: Rust 1.75

fn main() {
    println!("Rust Ownership Example");
    
    let s1 = String::from("hello");
    let s2 = s1; // Move occurs here
    
    println!("s1 moved to s2: {}", s2);
    
    let numbers = vec![1, 2, 3];
    let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();
    
    println!("Doubled: {:?}", doubled);
}
`,
  ruby: `# Nexus Ruby Playground
# Interpreter: Ruby 3.3

class Greeter
  def initialize(name)
    @name = name.capitalize
  end

  def say_hi
    puts "Hello #{@name}!"
  end
end

g = Greeter.new("world")
g.say_hi

puts "Ruby map example:"
puts [1, 2, 3, 4, 5].map { |n| n * n }.join(", ")
`,
  php: `<?php
// Nexus PHP Playground
// Interpreter: PHP 8.3

echo "PHP Array Processing\n";

$users = [
    ['name' => 'John', 'age' => 30],
    ['name' => 'Jane', 'age' => 25],
    ['name' => 'Bob',  'age' => 35]
];

$names = array_map(fn($u) => $u['name'], $users);

echo "Users: " . implode(", ", $names) . "\n";
echo "Done.";
?>
`,
  swift: `// Nexus Swift Playground
// Interpreter: Swift 5.9

import Foundation

print("Swift Protocols Example")

protocol Describable {
    var description: String { get }
}

struct Point: Describable {
    let x: Int
    let y: Int
    
    var description: String {
        return "Point(x: \\(x), y: \\(y))"
    }
}

let p = Point(x: 10, y: 20)
print(p.description)
`,
  bash: `# Nexus Bash Playground
# Interpreter: Bash 5.2

echo "System Report:"
echo "Date: $(date)"
echo "User: $(whoami)"

echo "Generating file structure..."
mkdir -p project/{src,dist}
touch project/src/main.js

echo "Tree:"
find project -maxdepth 3
`,
  sql: `-- Nexus SQL Playground
-- Interpreter: SQLite 3.44

CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT,
  email TEXT
);

INSERT INTO users (name, email) VALUES 
  ('Alice', 'alice@example.com'),
  ('Bob', 'bob@example.com'),
  ('Charlie', 'charlie@example.com');

SELECT * FROM users WHERE name LIKE 'B%';
`
};

export const EDITOR_THEME = {
  background: 'bg-gray-950',
  gutter: 'bg-gray-900',
  lineNo: 'text-gray-600',
  text: 'text-gray-100',
  cursor: 'border-blue-500',
};