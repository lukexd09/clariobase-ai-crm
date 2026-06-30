# Third Party Notices

## Shadboard

This project includes adapted source-derived boundaries from:

- Repository: `https://github.com/Qualiora/shadboard`
- Pinned release: `v1.5.1`
- Pinned commit: `ece0dab7282175002f5103afbac6f86306169a4e`
- License: MIT

### Source-boundary inventory

- `starter-kit/src/components/ui/card.tsx`
  -> `src/components/clariobase-ui/proof-card.tsx`
  -> `src/components/clariobase-ui/surface.tsx`
  -> classification: substantially adapted

- `starter-kit/src/components/ui/button.tsx`
  -> `src/components/clariobase-ui/button.tsx`
  -> classification: substantially adapted

- `starter-kit/src/components/ui/input.tsx`
  -> `src/components/clariobase-ui/field.tsx` (`Input` export only)
  -> classification: substantially adapted

- `starter-kit/src/components/ui/sheet.tsx`
  -> `src/components/clariobase-ui/sheet.tsx`
  -> classification: substantially adapted

## Direct Dependencies

- `@radix-ui/react-dialog` `1.1.3`
  - license: MIT
  - commercial use: allowed
  - current consumer: `src/components/clariobase-ui/sheet.tsx` / `src/components/app-shell.tsx`

- `lucide-react` `0.446.0`
  - license: ISC
  - commercial use: allowed
  - current consumer: `src/components/app-shell.tsx`

### Copyright and license text

Copyright (c) 2025 Qualiora

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
