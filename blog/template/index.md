---
title: Sample Blog Post
author: Benjamin Belikov
date: 2025-01-23
description: This is a sample blog post to demonstrate the blog template functionality.
tags: ["sample", "blog", "markdown"]
---

This is a **sample blog post** to demonstrate the blog template functionality.

## Features

&check-circle&

- &check-circle& Task completed successfully
- &alert-triangle& Warning: irreversible action!
- &rocket& Launch sequence ready!
- &search& Find your files

- Markdown rendering with snarkdownXT
- Syntax highlighting
- SEO-friendly content visibility
  - sublists
- Responsive design

## Code Example

```javascript
function greet(name) {
    return `Hello, ${name}!`;
}

console.log(greet("World"));
```

[] Wie gut das geht?
[x] Mal sehen
  [] kleine ahnung
[-] TODO: Fix mich

#~ !bgd
#2 !bgd
TODO: Fix mich
#6

Name     | Age | City
:--------|:---:|--------:
Alice    |  30 | Vienna
**Bob**  |  42 | Berlin
Charlie  |  27 | Paris

#!~

```python my_code.py
print("Hello, world!")
def greet(name):
    return f"Hello, {name}!"
```

~~hm~~

> !test Dies ist ein Blockquote test
> Lorem ~~Ipsum und so weiter~~

#~ Image Test
#6
#4
[![Sample Image](/img/this-is-fine.webp)](https://bbelius.dev)
#6
![Sample Image](/img/this-is-fine.webp)[(c) Me]
#!~

---

**bold**, __bold__

*italic*, _italic_

***bold italic***, ___bold italic___, **_bold italic_**, *__bold italic__*

++underline++

**++bold underline++**

*++italic underline++*

***++all three++***

#~ My Grid Row

#2
This is a left-aligned cell.

#3
This is a center-aligned cell.
#4
This is a right-aligned cell.
#5
This is an inline cell.
#!~
This is outside the grid.

## Conclusion

<!-- MarkDrown Baseline Feature Testpage: UNFORMATTED RAW MARKDOWN -->

---
title: MarkDrown All Features Testpage
author: Ben
---

# MarkDrown All Features Baseline

This page covers **all major features** of MarkDrown in raw markdown form. Each section is a direct test.

---

## 1. YAML Meta Header

---
title: Example Page
author: Tester
date: 2025-06-23
---

Meta header above. Should not render visible content.

---

## 2. Headings

# H1 Heading
## H2 Heading
### H3 Heading
#### H4 Heading
##### H5 Heading
###### H6 Heading

---

## 3. Paragraphs, Inline, Strong/Em/Underline/Del

Plain paragraph text.

Paragraph written 
in three lines, \\
but with one new line 

This has *italic*, **bold**, _italic_ and __bold__, ***bold+italic***, **_alt bold+italic_**, ++underline++, *++italic underline++*, **++bold underline++**, ~~strikethrough~~, and ***++crazy combo++***.

---

## 4. Inline Code & Code Blocks

This is `inline code`.

```js app.js
// Code block with language and filename
console.log("hello world");
```

```python
# Simple python code block
x = 42
```

```
No language, generic code block
```

---

## 5. Links, Images, Lucide Icons

[Standard Link](https://example.com)

![Alt text](https://placehold.co/48x32.png)[A simple caption]

[![Alt](https://placehold.co/32x32.png)[linked image]](https://openai.com)

&arrow-right& &alert-triangle& &rocket&

---

## 6. Lists (ordered, unordered, nested, alpha)

* Top Level
  * Nested
    * Deep
- Dash Bullet
+ Plus Bullet
1. Numbered
   1. Sub-numbered
      1. Deep
a. Alpha list
b. Another alpha item

---

## 7. Task Lists

[ ] Unchecked task
[x] Checked task
  [ ] Nested task
[-] Partial task

---

## 8. Blockquotes (with and without title)

> Simple blockquote
> Multi-line blockquote test.

> !warning Warning Title
> Blockquote with a class and title.\\
> Second line of warning.

> !tip Pro Tip
> Use blockquote titles for info banners.

---

## 9. Tables

| Name    | Value | Right |
|:--------|:-----:|------:|
| Alpha   | 123   |   X   |
| Bravo   | 456   |   Y   |
| Charlie | 789   |   Z   |

---

## 10. CSS Grid Block

#~ Responsive Feature Grid
#6
**Markdown**
The core syntax for documentation, specs, and more.
#6
**Plugins**
Extend MarkDrown with custom features.
#4 
**Grid**
Flexible layout for UI docs.
#8
**All Together**
Test combo of **bold**, `code`, [links](#), and &arrow-left&.
#4
#2
![img](https://placehold.co/24x24)
#!~

---

## 11. Horizontal Rule

---
***
___

---

## 12. Combo: Everything Nested

> !info Ultimate Combo
> # **Heading** in blockquote
> - List item *with italic*
> [ ] Task list in quote
> > Nested quote
> > *More*
> > [![icon](https://placehold.co/16x16)[icon]](https://github.com)
> | Table | Inline | Test |
> |:------|:-----:|-----:|
> | Yes   | **X** |  1   |
> | No    | *Y*   |  2   |
> ```js myfile.js
> // Blockquote with code
> let wow = 1;
> ```
> #~ Grid in Quote
> #6
> Nested Grid Cell
> #6
> Next Cell
> #!~

---

End of baseline test.
