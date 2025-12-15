import { Language } from './types';

export const LANGUAGES: Language[] = [
  { 
    id: 'javascript', 
    name: 'JavaScript', 
    prismId: 'javascript', 
    interpreters: [
      { id: 'js-universal', name: 'Universal JS Runtime', type: 'ai', version: 'Latest', description: 'Executes JS with auto-library detection and DOM support.' }
    ]
  },
  { 
    id: 'python', 
    name: 'Python', 
    prismId: 'python', 
    interpreters: [
      { id: 'py-universal', name: 'Universal Python Runtime', type: 'ai', version: '3.12', description: 'Executes Python with auto-library installation (NumPy, Pandas, etc).' }
    ]
  },
  { 
    id: 'html', 
    name: 'HTML / CSS', 
    prismId: 'markup', 
    interpreters: [
      { id: 'html-universal', name: 'Universal Web Renderer', type: 'ai', version: 'HTML5', description: 'Renders modern Web standards with Tailwind support.' }
    ]
  },
  { 
    id: 'typescript', 
    name: 'TypeScript', 
    prismId: 'typescript', 
    interpreters: [
      { id: 'ts-universal', name: 'Universal TS Runtime', type: 'ai', version: '5.3', description: 'Executes TypeScript with full type support.' }
    ]
  },
  { 
    id: 'go', 
    name: 'Go', 
    prismId: 'go', 
    interpreters: [
      { id: 'go-universal', name: 'Universal Go Runtime', type: 'ai', version: '1.21', description: 'Executes Go code with module support.' }
    ]
  },
  { 
    id: 'rust', 
    name: 'Rust', 
    prismId: 'rust', 
    interpreters: [
      { id: 'rust-universal', name: 'Universal Rust Runtime', type: 'ai', version: '1.75', description: 'Executes Rust with Cargo crate simulation.' }
    ]
  },
  { 
    id: 'cpp', 
    name: 'C++', 
    prismId: 'cpp', 
    interpreters: [
      { id: 'cpp-universal', name: 'Universal C++ Runtime', type: 'ai', version: 'C++20', description: 'Executes C++ with standard library support.' }
    ]
  },
  { 
    id: 'java', 
    name: 'Java', 
    prismId: 'java', 
    interpreters: [
      { id: 'java-universal', name: 'Universal Java Runtime', type: 'ai', version: '21', description: 'Executes Java with Maven dependency simulation.' }
    ]
  },
  { 
    id: 'ruby', 
    name: 'Ruby', 
    prismId: 'ruby', 
    interpreters: [
      { id: 'ruby-universal', name: 'Universal Ruby Runtime', type: 'ai', version: '3.2', description: 'Executes Ruby with Gem support.' }
    ]
  },
  { 
    id: 'php', 
    name: 'PHP', 
    prismId: 'php', 
    interpreters: [
      { id: 'php-universal', name: 'Universal PHP Runtime', type: 'ai', version: '8.2', description: 'Executes PHP with Composer simulation.' }
    ]
  },
  { 
    id: 'bash', 
    name: 'Bash', 
    prismId: 'bash', 
    interpreters: [
      { id: 'bash-universal', name: 'Universal Shell', type: 'ai', version: '5.2', description: 'Executes Shell scripts with system utilities.' }
    ]
  }
];

export const LANGUAGE_TEMPLATES: Record<string, string> = {
  javascript: `// Nexus Smart Runtime
// Try importing a library! 
// e.g. import _ from 'lodash';

const data = [
  { id: 1, value: 10 },
  { id: 2, value: 20 },
  { id: 3, value: 30 }
];

console.log("Processing Data...");
console.table(data);

// Dynamic Visualization
const total = data.reduce((acc, curr) => acc + curr.value, 0);
console.log(\`Total Value: \${total}\`);
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
  python: `# Nexus Smart Runtime - Auto Library Installation
# Try importing ANY library (pandas, numpy, matplotlib, etc.)

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

print("1. Creating DataFrame...")
df = pd.DataFrame({
    'A': np.random.randn(10),
    'B': np.random.randn(10)
})

print("2. Analysis Result:")
print(df.describe())

print("3. Generating Visualization...")
# The runtime will automatically render this plot
plt.figure(figsize=(10, 6))
plt.plot(df['A'], label='Series A')
plt.plot(df['B'], label='Series B')
plt.title("Random Data Analysis")
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
    println!("Rust Runtime Active");
    
    let numbers = vec![1, 2, 3, 4, 5];
    let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();
    
    println!("Doubled Values: {:?}", doubled);
}
`,
  cpp: `#include <iostream>
#include <vector>
#include <algorithm>
#include <string>

int main() {
    std::vector<std::string> inventory = {"Sword", "Shield", "Potion"};
    
    std::cout << "Inventory:" << std::endl;
    for (const auto& item : inventory) {
        std::cout << "- " << item << std::endl;
    }
    
    return 0;
}
`,
  java: `import java.util.stream.IntStream;

public class Main {
    public static void main(String[] args) {
        System.out.println("Java Runtime Active");
        
        IntStream.range(1, 10).forEach(i -> {
            System.out.println("Processing item " + i);
        });
    }
}
`,
  ruby: `require 'json'

puts "Ruby Runtime Active"

data = { name: "Nexus", status: "Online" }
puts JSON.pretty_generate(data)
`,
  php: `<?php
echo "PHP Runtime Active\n";

$data = ['Apple', 'Banana', 'Cherry'];
print_r($data);
?>
`,
  bash: `echo "Environment Check:"
echo "------------------"
echo "User: $(whoami)"
echo "Shell: $SHELL"
`
};

export const EDITOR_THEME = {
  background: 'bg-gray-950',
  gutter: 'bg-gray-900',
  lineNo: 'text-gray-600',
  text: 'text-gray-100',
  cursor: 'border-blue-500',
};