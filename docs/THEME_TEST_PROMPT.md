# Theme Test Prompt

Paste the following into a Claude Desktop chat to display all themed elements at once.

---

```
Display all theme elements in a single message. Include every one of the following:

1. Normal text (show primary, secondary, and muted text variations)
2. A sentence containing `inline code` (shows inlineCodeText)
3. A short code block (shows codeBg + Shiki syntax highlighting):
```python
def hello(name: str) -> str:
    return f"Hello, {name}!"
print(hello("Arizona"))
```
4. A [clickable link](https://example.com) (shows accentPrimary)
5. **Bold text** and *italic text*
6. A bullet list (3 items)
7. A numbered list (3 items)
8. A table (3 columns × 3 rows with header)
9. A blockquote
10. Color codes: #FF0000 #00FF00 #0000FF #FFAA00 #FF78A6 #65EAC4 (verify color swatches)
11. A success/warning/error context sentence (shows successColor)
12. A horizontal rule

Output all elements without omission as actual rendered content.
```
