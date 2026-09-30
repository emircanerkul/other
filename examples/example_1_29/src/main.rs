#![allow(unused)]

use rand::Rng;
use std::cmp::Ordering;
use std::collections::HashMap;
use std::f32::consts::PI;
use std::fs::File;
use std::io;
use std::io::{BufRead, BufReader, ErrorKind, Write};

fn example_29() {
    trait Shape {
        fn new(length: u32, width: u32) -> Self;
        fn area(&self) -> f32;
    }

    struct Rectangle {
        length: u32,
        width: u32,
    };

    struct Circle {
        length: u32,
        width: u32,
    };

    impl Shape for Rectangle {
        fn new(length: u32, width: u32) -> Rectangle {
            Rectangle { length, width }
        }

        fn area(&self) -> f32 {
            (self.length * self.width) as f32
        }
    }

    impl Shape for Circle {
        fn new(length: u32, width: u32) -> Circle {
            Circle { length, width }
        }

        fn area(&self) -> f32 {
            (self.length as f32 / 2.0).powf(2.0) * PI
        }
    }

    let rec = Rectangle {
        length: 30,
        width: 50,
    };
    let sqr = Circle {
        length: 30,
        width: 30,
    };
    println!("rec.width: {}", rec.width);
    println!("sqr.width: {}", sqr.width);

    println!("rec.area: {}", rec.area());
    println!("sqr.area: {}", sqr.area());
}

fn example_28() {
    struct Customer {
        name: String,
        address: String,
        balance: f32,
    }
    let mut emircan = Customer {
        name: String::from("Emircan"),
        address: String::from("Istanbul"),
        balance: 0.0,
    };

    emircan.address = String::from("Kocaeli");
    println!("{}", emircan.address);
    println!("{}", emircan.name);
    println!("{}", emircan.balance);
}

fn example_27() {
    let mut heroes = HashMap::new();

    heroes.insert("Superman", "Clark Kent");
    heroes.insert("Batman", "Bruce Wayne");
    heroes.insert("The Flash", "Barry Allen");

    for (key, value) in heroes.iter() {
        println!("{} = {}", key, value);
    }

    println!("Batman in heroes? {}", heroes.contains_key("Batman"));
    println!("Hero at position 2: {}", heroes.get(&"The Flash").unwrap());
}

fn example_26_welcome(name: &mut String) {
    name.push_str(", Welcome!");
}

fn example_26() {
    let mut str1 = String::from("Emircan");
    example_26_welcome(&mut str1);
    println!("{}", str1);
}

fn example_25() {
    let str1 = String::from("Hello");
    let str2 = str1.clone();
    println!("{} {}", str1, str2);
}

fn example_24_get_sum_gen<T>(x: T, y: T) -> T
where
    T: std::ops::Add<Output = T>,
{
    x + y
}

fn example_24() {
    println!("5 + 4 = {}", example_24_get_sum_gen(5, 4));
    println!("5.3 + 4.42 + 2 = {}", example_24_get_sum_gen(5.3, 4.42));
}

fn example_23() {
    let num_list = vec![1, 2, 3, 4, 5];
    let result = example_23_sum_list(&num_list[..]);
    println!("Sum of lst: {}", result);
}

fn example_23_sum_list(list: &[i32]) -> i32 {
    let mut sum = 0;
    for &val in list {
        sum += val;
    }
    sum
}
fn example_22() {
    println!("{:?}", example_22_get_math(5, 3));
    println!("{}", example_22_get_sum(5, 3));
}

fn example_22_get_math(x: i32, y: i32) -> (i32, i32) {
    (x + y, x - y)
}

fn example_22_get_sum(x: i32, y: i32) -> i32 {
    x + y
}
fn example_21() {
    let vec1: Vec<i32> = Vec::new();
    let mut vec2: Vec<i32> = vec![1, 2, 3, 4];
    vec2.push(5);
    println!("1st element: {}", vec2[0]);
    let second: &i32 = &vec2[1];

    match vec2.get(5) {
        Some(second) => println!("5nd element: {}", second),
        None => println!("There is no 5nd element"),
    }
    for i in &mut vec2 {
        *i *= 2;
    }
    for i in &vec2 {
        println!("{}", i);
    }
    println!("Vector length: {}", vec2.len());
    println!("Pop: {:?}", vec2.pop());
}

fn example_20() {
    enum Days {
        Monday,
        Tuesday,
        Wednesday,
        Thursday,
        Friday,
        Saturday,
        Sunday,
    }

    impl Days {
        fn is_weekend(&self) -> bool {
            match self {
                Days::Saturday | Days::Sunday => true,
                _ => false,
            }
        }
    }

    let today: Days = Days::Saturday;
    println!("{}", today.is_weekend());
}

fn example_19() {
    let int_u8 = 4;
    let int_u16 = 5;
    let int_u32 = (int_u8 as u32) + (int_u16 as u32);
    println!("{} {} {}", int_u8, int_u16, int_u32);
}
fn example_18() {
    let string = String::from("x x r a w v l l k x r");
    let mut v1: Vec<char> = string.chars().collect();
    v1.sort();
    v1.dedup();
    for char in v1 {
        println!("{}", char);
    }
    let string2 = "String";
    let mut string3: String = string2.to_string();
    println!("{} {}", string2, string3);
    let byte_arr_string_2 = string2.as_bytes();
    let string4 = &string3[0..3];
    println!("{}", string4);
    string3.clear();
    let string5 = String::from("hello");
    let string6 = String::from("world");
    let string7 = string5 + &string6;
    println!("{} {}", string6, string7);
}

fn example_17() {
    let mut string1 = String::new();
    string1 += "a";
    string1.push('H');
    string1.push_str("World");
    string1 = string1.replace("aH", "Hello ");
    println!("{}", string1);
}

fn example_16() {
    let my_tuple = (1, "hello", 4.5, true);
    println!("1: {}", my_tuple.0);

    let (x, y, z, w) = my_tuple;
    println!("{} {} {} {}", x, y, z, w);
}

fn example_15() {
    let arr_1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    let mut loop_idx: usize = 0;

    for item in arr_1 {
        println!("index: {}", item);
    }
}

fn example_14() {
    let arr_1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    let mut loop_idx: usize = 0;

    while loop_idx < arr_1.len() {
        println!("index: {}", arr_1[loop_idx]);
        loop_idx += 1;
    }
}

fn example_13() {
    let arr_1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    let mut loop_idx: usize = 0;

    loop {
        if arr_1[loop_idx] % 2 == 0 {
            loop_idx += 1;
            continue;
        }
        if arr_1[loop_idx] == 9 {
            break;
        }
        println!("index: {}", arr_1[loop_idx]);
        loop_idx += 1;
    }
}

fn example_12() {
    let arr_1 = [1, 2, 3, 4];
    println!("1st: {}", arr_1[0]);
    println!("Length: {}", arr_1.len());

    for i in 0..arr_1.len() {
        println!("{}", arr_1[i] * 2);
    }
}

fn example_11() {
    let age = 18;
    let voting_age = 18;
    match age.cmp(&voting_age) {
        Ordering::Less => println!("Cant vote"),
        Ordering::Greater | Ordering::Equal => println!("Can vote"),
    }
}

fn example_10() {
    let age = 1;
    match age {
        1..=18 => println!("Happy birthday"),
        21 | 50 => println!("Kinda Important birthday"),
        40 => println!("Most Important birthday"),
        41..=i32::MAX => println!("Kinda Important birthday"),
        _ => println!("It's a birthday"),
    }
}

fn example_9() {
    let mut age: i32 = 47;
    let can_vote = if age >= 18 { true } else { false };
    println!("can vote: {}", can_vote);
}

fn example_8() {
    let age = 12;
    if (age >= 1) && (age <= 18) {
        println!("Happy birthday");
    } else if (age == 21) || (age == 50) {
        println!("Kinda Important birthday");
    } else if (age == 40) {
        println!("Most Important birthday");
    } else {
        println!("It's a birthday");
    }
}

fn example_7() {
    let mut random = rand::thread_rng().gen_range(1..101);
    println!("Random: {}", random);
    for _ in 0..10 {
        random = rand::thread_rng().gen_range(1..101);
        println!("Random: {}", random);
    }
}

fn example_6() {
    let num_1: f32 = 5.0;
    let num_2: f32 = 3.0;
    println!("num_1 + num_2 = {}", num_1 + num_2);
    println!("num_1 - num_2 = {}", num_1 - num_2);
    println!("num_1 * num_2 = {}", num_1 * num_2);
    println!("num_1 / num_2 = {}", num_1 / num_2);
    println!("num_1 % num_2 = {}", num_1 % num_2);
}

fn example_5() {
    let num_1: u32 = 5;
    let num_2: u32 = 3;
    println!("num_1 + num_2 = {}", num_1 + num_2);
    println!("num_1 - num_2 = {}", num_1 - num_2);
    println!("num_1 * num_2 = {}", num_1 * num_2);
    println!("num_1 / num_2 = {}", num_1 / num_2);
    println!("num_1 % num_2 = {}", num_1 % num_2);
}
fn example_4() {
    let num_1: f32 = 1.111111111111111;
    println!("num_1: {}", num_1);
    let num_2: f32 = 2.222222222222222;
    println!("num_2: {}", num_2);

    println!("num_1 + num_2: {}", num_1 + num_2);
}

fn example_3() {
    println!("**** MAX VALUES ****");
    println!("Max u32: {}", u32::MAX);
    println!("Max u64: {}", u64::MAX);
    println!("Max u128: {}", u128::MAX);
    println!("Max usize: {}", usize::MAX);
    println!("Max f32: {}", f32::MAX);
    println!("Max f64: {}", f64::MAX);
    println!("Max i8: {}", i8::MAX);
    println!("Max i16: {}", i16::MAX);
    println!("Max i32: {}", i32::MAX);
    println!("Max i64: {}", i64::MAX);
    println!("Max i128: {}", i128::MAX);

    println!("**** MIN VALUES ****");
    println!("Min u32: {}", u32::MIN);
    println!("Min u64: {}", u64::MIN);
    println!("Min u128: {}", u128::MIN);
    println!("Min usize: {}", usize::MIN);
    println!("Min f32: {}", f32::MIN);
    println!("Min f64: {}", f64::MIN);
    println!("Min i8: {}", i8::MIN);
    println!("Min i16: {}", i16::MIN);
    println!("Min i32: {}", i32::MIN);
    println!("Min i64: {}", i64::MIN);
    println!("Min i128: {}", i128::MIN);
}

fn example_2() {
    const ONE_MIL: u32 = 1_000_000;
    const PI: f32 = 3.141592;
    let age: &str = "47";
    let mut age: u32 = age.trim().parse().expect("Age was not assigned a number");
    age = age + 1;
    println!("Age next year: {}", age);
}

fn example_1() {
    println!("What's your name!");
    let mut name = String::new();
    let greeting = "Nice to meet you";
    io::stdin()
        .read_line(&mut name)
        .expect("did not enter a correct string");
    println!("Hello, world! {}! {}", &name, &greeting);
}

fn main() {
    // Run one learning example at a time. The wasm playground sets
    // EXAMPLE_NO (e.g. "7"); without it, all examples run in order like the
    // original `cargo run`. example_1 needs stdin — under emscripten the
    // shell feeds it from the prompt box (see scratch/rust-playground-src).
    let picked: Option<u32> = std::env::var("EXAMPLE_NO")
        .ok()
        .and_then(|v| v.trim().parse().ok());
    match picked {
        Some(n) if (1..=29).contains(&n) => run_one(n),
        Some(other) => println!("No example {} in this crate (runs 1..=29)", other),
        None => {
    example_1();
    example_2();
    example_3();
    example_4();
    example_5();
    example_6();
    example_7();
    example_8();
    example_9();
    example_10();
    example_11();
    example_12();
    example_13();
    example_14();
    example_15();
    example_16();
    example_17();
    example_18();
    example_19();
    example_20();
    example_21();
    example_22();
    example_23();
    example_24();
    example_25();
    example_26();
    example_27();
    example_28();
    example_29();
        }
    }
}

fn run_one(n: u32) {
    match n {
        1 => example_1(),
        2 => example_2(),
        3 => example_3(),
        4 => example_4(),
        5 => example_5(),
        6 => example_6(),
        7 => example_7(),
        8 => example_8(),
        9 => example_9(),
        10 => example_10(),
        11 => example_11(),
        12 => example_12(),
        13 => example_13(),
        14 => example_14(),
        15 => example_15(),
        16 => example_16(),
        17 => example_17(),
        18 => example_18(),
        19 => example_19(),
        20 => example_20(),
        21 => example_21(),
        22 => example_22(),
        23 => example_23(),
        24 => example_24(),
        25 => example_25(),
        26 => example_26(),
        27 => example_27(),
        28 => example_28(),
        29 => example_29(),
        _ => unreachable!(),
    }
}
