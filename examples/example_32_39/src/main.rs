#![allow(unused)]

use std::{
    slice::Iter,
    sync::{Arc, Mutex},
    thread,
    time::Duration,
};

#[cfg(not(target_family = "wasm"))]
fn example_39() {
    pub struct Bank {
        balance: f32,
    }

    fn withdraw(bank: &Arc<Mutex<Bank>>, amount: f32) {
        let mut bank_ref = bank.lock().unwrap();
        if bank_ref.balance < 5.00 {
            println!(
                "Current balance is: {} Insufficient funds",
                bank_ref.balance
            );
        } else {
            bank_ref.balance -= amount;
            println!(
                "Withdrew {} Current balance is: {}",
                amount, bank_ref.balance
            );
        }
    }

    fn customer(bank: Arc<Mutex<Bank>>) {
        withdraw(&bank, 5.00);
    }

    let bank = Arc::new(Mutex::new(Bank { balance: 20.00 }));

    let handles = (0..10).map(|_| {
        let bank = bank.clone();

        thread::spawn(|| {
            customer(bank);
        })
    });

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final balance: {}", bank.lock().unwrap().balance);
}

#[cfg(not(target_family = "wasm"))]
fn example_38() {
    let thread1 = thread::spawn(|| {
        for i in 1..24 {
            println!("hi number {} from the spawned thread!", i);
            thread::sleep(Duration::from_millis(10))
        }
    });

    for i in 1..10 {
        println!("Main thread: {}!", i);
        thread::sleep(Duration::from_millis(10));
    }

    thread1.join().unwrap();
}

fn example_37() {
    struct TreeNode<T> {
        pub left: Option<Box<TreeNode<T>>>,
        pub right: Option<Box<TreeNode<T>>>,
        pub key: T,
    }

    impl<T: std::fmt::Debug> TreeNode<T> {
        pub fn new(key: T) -> TreeNode<T> {
            TreeNode {
                left: None,
                right: None,
                key,
            }
        }
        pub fn left(mut self, node: TreeNode<T>) -> Self {
            self.left = Some(Box::new(node));
            self
        }
        pub fn right(mut self, node: TreeNode<T>) -> Self {
            self.right = Some(Box::new(node));
            self
        }
        pub fn walk(&self) {
            println!("{:?}", self.key);
            if let Some(ref left) = self.left {
                left.walk();
            }
            if let Some(ref right) = self.right {
                right.walk();
            }
        }
    }

    let node1 = TreeNode::new(1)
        .left(TreeNode::new(2))
        .right(TreeNode::new(3));
    node1.walk();
}

fn example_36() {
    let b_int1 = Box::new(10);
    println!("b_int1 = {}", b_int1);
}
fn example_35() {
    fn use_func<T>(a: i32, b: i32, func: fn(i32, i32) -> T) -> T {
        func(a, b)
    }

    let sum = |a: i32, b: i32| a + b;
    let prod = |a: i32, b: i32| a * b;
    println!("5 + 4 = {}", use_func(5, 4, sum));
    println!("5 * 4 = {}", use_func(5, 4, prod));
}

fn example_34() {
    let mut samp1 = 5;
    let print_var = || println!("samp1 = {}", samp1);
    print_var();

    samp1 = 30;
    let mut change_var = || samp1 += 1;
    change_var();
    println!("samp1 = {}", samp1);
    samp1 = 10;
    println!("samp1 = {}", samp1);
}

fn example_33() {
    let can_vote = |age: i32| age >= 18;
    println!("can vote: {}", can_vote(8));
}

fn example_32() {
    let mut arr_it: [i32; 5] = [1, 2, 3, 4, 5];
    for i in arr_it.iter() {
        println!("{}", i);
    }
    let mut iter1: Iter<i32> = arr_it.iter();
    println!("{:?}", iter1.next());
}

fn main() {
    #[cfg(not(target_family = "wasm"))]
    example_38();
    #[cfg(target_family = "wasm")]
    println!("(example_38: threads are not available in the browser wasm runtime — skipped)");
    example_37();
    example_36();
    example_35();
    example_34();
    example_33();
    example_32();
    #[cfg(not(target_family = "wasm"))]
    example_39();
    #[cfg(target_family = "wasm")]
    println!("(example_39: threads are not available in the browser wasm runtime — skipped)");
}
