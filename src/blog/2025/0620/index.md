---
tpl: blog
title: MarkDrown Reference Documentation
subtitle: Building a Blog with AI Agents
author: Ben
date: 2025-06-20
description: Showcase and Testdocument
tags: ["blog", "markdown", "northlight"]
category: projects
picture: /img/blog/0620.jpg
---

### Table of Contents

1. [Meta Header](#meta-header)
2. [Headings](#headings)
3. [Paragraphs and Inline Formatting](#paragraphs-and-inline-formatting)
4. [Code Blocks & Inline Code](#code)
5. [Links](#links)
6. [Images & Figures](#images-figures)
7. [Icons (Lucide)](#icons)
8. [Lists](#lists)
9. [Task Lists](#task-lists)
10. [Blockquotes](#blockquotes)
11. [Tables](#tables)
12. [CSS Grid Blocks](#css-grid-blocks)
13. [Horizontal Rules](#horizontal-rules)
14. [Combos & Advanced](#combos-advanced)

---

### #meta-header Meta Header

Place at the top. Sets doc meta.

```yaml
---
title: My Document
author: Alice
date: 2025-01-01
---
```

### #headings Headings

```md
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
# #headingId1 Heading 1
## #headingId2 Heading 2
### #headingId3 Heading 3
#### #headingId4 Heading 4
##### #headingId5 Heading 5
###### #headingId6 Heading 6
```

### #paragraphs-and-inline-formatting Paragraphs and Inline Formatting

- *Italic* or _italic_
- **Bold** or __bold__
- ***Bold Italic*** or **_Bold Italic_**
- ++Underline++
- *++Italic Underline++*
- **++Bold Underline++**
- ~~Strikethrough~~
- ***++All Three++***

This is *italic*, **bold**, ++underline++, ~~strikethrough~~, ***++crazy combo++***.

```md
This is *italic*, **bold**, ++underline++, ~~strikethrough~~, ***++crazy combo++***.
```

### #code Code Blocks & Inline Code

Inline: `inline code`

```
`inline code`
```

Block:
```js
// JS code
console.log('hi');
```

```
// Remove the comments in front of ```
// ```js
// JS code
console.log('hi');
// ```
```

Optional language and filename:
```js app.js
console.log('with filename');
```

```
// ```js app.js
console.log('with filename');
// ```
```

### #links Links

[bbelius.dev](https://bbelius.dev)

```md
[bbelius.dev](https://bbelius.dev)
```

### #images-figures Images & Figures

Basic image:

![Alt text](/img/profile-smol.jpg)

```md
![Alt text](/img/profile-smol.jpg)
```

---

Image with caption:
![Alt text](/img/profile-smol.jpg)[This is the caption]

```md
![Alt text](/img/profile-smol.jpg)[This is the caption]
```

---

Linked image:
[![Alt text](/img/profile-smol.jpg)](https://coff.ee/bbelius)

```md
[![Alt text](/img/profile-smol.jpg)](https://coff.ee/bbelius)
```

---

Linked image with caption:
[![Alt](/img/profile-smol.jpg)[This is the caption]](https://coff.ee/bbelius)

```md
[![Alt](/img/profile-smol.jpg)[This is the caption]](https://coff.ee/bbelius)
```

### #icons Icons (Lucide)

Any Lucide icon &palette&

&bird&

```
&bird&
```

&rocket& &arrow-right& &user-check&

```md
&rocket& &arrow-right& &user-check&
```

### #lists Lists

Unordered:
* Bullet
- Dash
+ Plus

```md
* Bullet
- Dash
+ Plus
```
---

Ordered (number):
1. First
2. Second

```md
1. First
2. Second
```
---

Ordered (alpha):
A. Alpha one
B. Alpha two

```md
A. Alpha one
B. Alpha two
```
---

Nested:
* Item 1
  * Subitem
    * Sub-subitem

```md
* Item 1
  * Subitem
    * Sub-subitem
```

### #task-lists Task Lists

[ ] To do
[x] Done
[-] Partial
  [ ] Subtask

```md
[ ] To do
[x] Done
[-] Partial
  [ ] Subtask
```
---

- [ ] To do
- [x] Done
- [-] Partial
  - [ ] Subtask

```md
- [ ] To do
- [x] Done
- [-] Partial
  - [ ] Subtask
```

### #blockquotes Blockquotes

Simple:
> This is a quote.

```md
> This is a quote.
```
---

With class & title:
> !warning Important
> This is a warning blockquote.

```md
> !warning Important
> This is a warning blockquote.
```

### #tables Tables

 Name  | Value | Right 
:------|:-----:|------:
 Foo   | 100   |   X   
 Bar   | 200   |   Y   

```md
 Name  | Value | Right 
:------|:-----:|------:
 Foo   | 100   |   X   
 Bar   | 200   |   Y   
```

### #css-grid-blocks CSS Grid Blocks

#~ Optional Grid Title
#6
Content in first cell
#6
Content in second cell
#!~

```md
#~ Optional Grid Title
#6
Content in first cell
#6
Content in second cell
#!~
```
---

Example with various content:

#~ Feature Grid Example
#4
**Markdown**\\
Feature docs
#4
**Table**\\
Test|Val
:-|:-
A|1
A|1
#4
&rocket&
**Lucide Icon!**
#!~

```md
#~ Feature Grid Example
#4
**Markdown**\\
Feature docs
#4
**Table**\\
Test|Val
:-|:-
A|1
A|1
#4
&rocket&
**Lucide Icon!**
#!~
```

### #horizontal-rules Horizontal Rules

---
***
___

```md
---
***
___
```

### #combos-advanced Combos & Advanced

Combine features:

> !tip Nested Example
> # Heading in Quote
> 1. List in
> 2. a Quote
> [ ] Task in Quote
> > Nested blockquote
> > ![img](https://placehold.co/16x16.png)[icon]
>  Table | Wow 
> :------|----:
>  Yes   | 123 
>  No    | 123 
> ```js mydoc.js
> // code in quote
> alert('yes');
> ```

```md
> !tip Nested Example
> # Heading in Quote
> 1. List in
> 2. a Quote
> [ ] Task in Quote
> > Nested blockquote
> > ![img](https://placehold.co/16x16.png)[icon]
>  Table | Wow 
> :------|----:
>  Yes   | 123 
>  No    | 123 
> ```js mydoc.js
> // code in quote
> alert('yes');
> ```
```

### More...

TODO: Document latest plugins
