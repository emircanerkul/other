// rust-playground.mjs — lists every learning example (1–39, from the branch
// README) and runs the crate that owns it with EXAMPLE_NO set, so each sidebar
// entry executes exactly one example. Emscripten glue stdout is routed to the
// output pane; example_1's stdin prompt is fed via the input row.
const $status = document.getElementById('status');
const $frame = document.getElementById('frame');
const $list = document.getElementById('list');

const crates = await (await fetch('./examples.json')).json();
const builtBySlug = new Map(crates.map((c) => [c.slug, c]));

// one entry per LEARNING EXAMPLE (1–39), mapped to its owning crate
const EXAMPLE_META = [
  [1, "Asks for the user's name and greets them"],
  [2, 'Assigns a number to a constant, parses a string to a number, and increments the number'],
  [3, 'Prints the maximum and minimum values for various data types'],
  [4, 'Prints the result of adding two floating point numbers'],
  [5, 'Prints the result of performing arithmetic operations on two unsigned integers'],
  [6, 'Prints the result of performing arithmetic operations on two floating point numbers'],
  [7, 'Generates and prints random numbers'],
  [8, 'Checks the age and prints a message based on conditions'],
  [9, 'Checks the age and assigns a boolean value based on conditions'],
  [10, 'Matches the age and prints a message based on the match'],
  [11, 'Compares the age and prints a message based on the comparison'],
  [12, 'Prints the first element and length of an array, and performs an operation on each element'],
  [13, 'Iterates through an array and prints elements based on conditions'],
  [14, 'Iterates through an array using a while loop and prints each element'],
  [15, 'Demonstrates a for loop and a nested loop with labels'],
  [16, 'Demonstrates the usage of ranges in for loops'],
  [17, 'Demonstrates decision making with if, else if, and else'],
  [18, 'Demonstrates the usage of match for control flow'],
  [19, 'Demonstrates a while loop with a condition'],
  [20, 'Demonstrates an infinite loop with a break condition'],
  [21, 'Demonstrates the usage of a for loop with a range'],
  [22, 'Demonstrates basic function definition and calling'],
  [23, 'Demonstrates functions with return values and parameters'],
  [24, 'Demonstrates generic functions'],
  [25, 'Demonstrates string operations and cloning'],
  [26, 'Modifies a string reference and prints the modified string'],
  [27, 'Demonstrates HashMap operations such as insertion, iteration, and retrieval'],
  [28, 'Demonstrates struct creation and modification'],
  [29, 'Demonstrates trait implementation for shapes, and calculates areas for rectangle and circle'],
  [30, 'Demonstrates mod usage (restaurant order example)'],
  [31, 'Demonstrates file system usage and error handling'],
  [32, 'Demonstrates the usage of iterators to iterate over an array'],
  [33, 'Demonstrates the usage of closures to create predicates'],
  [34, 'Demonstrates the usage of closures to capture variables and modify them'],
  [35, 'Demonstrates the usage of higher-order functions and function pointers'],
  [36, 'Demonstrates using a box to store data on the heap'],
  [37, 'Demonstrates a recursive data structure (binary tree)'],
  [38, 'Demonstrates threads to spawn a new thread and join it with the main thread'],
  [39, 'Demonstrates threads and mutex to simulate a bank with multiple customers making withdrawals'],
];

function crateFor(n) {
  if (n <= 29) return builtBySlug.get('example_1_29');
  if (n === 30) return builtBySlug.get('example_30');
  if (n === 31) return builtBySlug.get('example_31');
  return builtBySlug.get('example_32_39');
}

const buttons = new Map();
for (const [n, desc] of EXAMPLE_META) {
  const crate = crateFor(n);
  const b = document.createElement('button');
  const title = document.createElement('span');
  title.className = 'ex-title';
  title.textContent = `Example ${n}`;
  const sub = document.createElement('span');
  sub.className = 'ex-desc';
  sub.textContent = crate?.built ? desc : 'needs the build toolchain — source only';
  b.append(title, sub);
  b.title = desc;
  b.disabled = !crate?.built;
  b.onclick = () => run(n, crate);
  $list.appendChild(b);
  buttons.set(n, b);
}

function setStatus(t) { $status.textContent = t; }

function run(n, crate) {
  for (const [, b] of buttons) b.classList.remove('active');
  buttons.get(n)?.classList.add('active');
  setStatus(`loading example ${n} (${crate.slug})…`);
  // the runner page reads ?ex= (crate) and ?n= (example number) and wires
  // Module.print etc.; EXAMPLE_NO selects the single example to run
  $frame.src = `./runner.html?ex=${encodeURIComponent(crate.slug)}&n=${n}`;
  $frame.addEventListener('load', () => setStatus(`example ${n} — loaded`), { once: true });
}

const wanted = Number(new URLSearchParams(location.search).get('ex'));
const first = wanted >= 1 && wanted <= 39 ? wanted : 1;
run(first, crateFor(first));
