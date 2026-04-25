**This requires patching Anthropic's argv guard (Layer 4).** The theme injector does NOT do this automatically. It's a separate, opt-in step.

### Patching the argv guard

After running `inject_theme_loader.js`, the argv guard needs to be patched separately:

```bash
# 1. Extract the (already theme-patched) asar

npx @electron/asar extract /app.asar ./app_work
```

```
```

```
```

```
```

```

# 2. Find the guard function
```

```

grep -r "remote-debugging-port" ./app_work/.vite/build/ --include="\*.js" -l
```

```
```

```
```

```
```
