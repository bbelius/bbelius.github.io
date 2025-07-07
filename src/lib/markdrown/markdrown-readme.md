---
title: MarkDrown Reference Documentation
author: Ben
date: 2025-06-24
---

# MarkDrown Markdown Syntax Reference

## Table of Contents

1. [Meta Header](#meta-header)
2. [Headings](#headings)
3. [Paragraphs and Inline Formatting](#paragraphs-and-inline-formatting)
4. [Code Blocks & Inline Code](#code)
5. [Links](#links)
6. [Images & Figures](#images-figures)
7. [Icons (Lucide)](#icons)
8. [Lists](#lists)
9. [Task Lists](#task-lists)
10. [Feature Lists](#feature-lists)
11. [Blockquotes](#blockquotes)
12. [Tables](#tables)
13. [CSS Grid Blocks](#css-grid-blocks)
14. [Horizontal Rules](#horizontal-rules)
15. [Combos & Advanced](#combos-advanced)

---

## #meta-header Meta Header

```yaml
---
title: My Document
author: Alice
date: 2025-01-01
---
```

Place at the top. Sets doc meta.

---

## #headings Headings

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

---

## #paragraphs-and-inline-formatting Paragraphs and Inline Formatting

- *Italic* or _italic_
- **Bold** or __bold__
- ***Bold Italic*** or **_Bold Italic_**
- ++Underline++
- *++Italic Underline++*
- **++Bold Underline++**
- ~~Strikethrough~~
- ***++All Three++***

```md
This is *italic*, **bold**, ++underline++, ~~strikethrough~~, ***++crazy combo++***.
```

---

## #code Code Blocks & Inline Code

Inline: `inline code`

```
`inline code`
```

Block:
```js
// JS code
console.log('hi');
```
```python
# Python code
print('hello')
```

Optional language and filename:
```js app.js
console.log('with filename');
```

---

## #links Links

```md
[OpenAI](https://openai.com)
```

---

## #images-figures Images & Figures

Basic image:
```md
![Alt text](https://placehold.co/64x32.png)
```

Image with caption:
```md
![Alt text](https://placehold.co/64x32.png)[This is the caption]
```

Linked image:
```md
[![Alt](https://placehold.co/32x32.png)](https://example.com)
```

Linked image with caption:
```md
[![Alt](https://placehold.co/32x32.png)[caption]](https://example.com)
```

---

## #icons Icons (Lucide)

Any Lucide icon:  
```
&icon-name&
```

```md
&rocket& &arrow-right& &user-check&
```

---

## #lists Lists

Unordered:
```md
* Bullet
- Dash
+ Plus
```

Ordered (number):
```md
1. First
2. Second
```

Ordered (alpha):
```md
A. Alpha one
B. Alpha two
```

Nested:
```md
* Item 1
  * Subitem
    * Sub-subitem
```

---

## #task-lists Task Lists

```md
[ ] To do
[x] Done
[-] Partial
  [ ] Subtask
```

---

## #feature-lists Feature Lists

Interactive skill/feature lists with clickable tags and descriptions:

```md
!features Core Competencies
* team-leadership | users | Team Leadership
  2023+ • Vienna Symphonic Library
  Transparency, not control - helping engineers grow, ship confidently, and own their work.

* devops-cicd | server-cog | DevOps & CI/CD
  10+ years • NP4, Vienna Symphonic Library
  Beyond writing code - I build and run the pipelines, deployments, and infrastructure that keep it alive in production.

* system-design | pencil-ruler | System Design
  2020+ • Vienna Symphonic Library
  I design scalable, maintainable systems with focus on reliability and future growth.
!/features
```

**Syntax:**
- Start with `!features` followed by optional section title
- Each feature: `* feature-id | lucide-icon | Display Name`
- Next line: meta information (dates, companies, etc.)
- Following lines: description content (supports **formatting**)
- End with `!/features`
- Feature IDs: lowercase with hyphens
- Icons: valid [Lucide icon names](https://lucide.dev/icons/)

**Features:**
- Interactive: click tags to show descriptions
- Responsive design
- Smooth animations
- Auto-initialization

---

## #blockquotes Blockquotes

Simple:
```md
> This is a quote.
```

With class & title:
```md
> !warning Important
> This is a warning blockquote.
```

---

## #tables Tables

```md
 Name  | Value | Right 
:------|:-----:|------:
 Foo   | 100   |   X   
 Bar   | 200   |   Y   
```

 Name  | Value | Right 
:------|:-----:|------:
 Foo   | 100   |   X   
 Bar   | 200   |   Y   

---

## #css-grid-blocks CSS Grid Blocks

```md
#~ Optional Grid Title
#6
Content in first cell
#6
Content in second cell
#!~
```

*Example with various content:*

```md
#~ Feature Grid Example
#4
**Markdown**\nFeature docs
#4
**Table**\n|Test|Val|\n|:-|:-|\n|A|1|
#4
&rocket&\n**Lucide Icon!**
#!~
```

---

## #horizontal-rules Horizontal Rules

```md
---
***
___
```

---

## #combos-advanced Combos & Advanced

Combine any features:

```md
> !tip Nested Example
> # Heading in Quote
> 1. List in Quote
>    - [ ] Task in Quote
> > Nested blockquote
> > ![img](https://placehold.co/16x16.png)[icon]
> | Table | Wow |
> |:------|----:|
> | Yes   | 123 |
> ```js
> // code in quote
> alert('yes');
> ```
```

---

## More...

Add plugins as needed. Use this doc as your canonical reference!
