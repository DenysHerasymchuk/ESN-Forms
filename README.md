[![ESN Forms banner](public/pictures/esn-forms-banner.jpeg)](https://esngeel.org)
<h1 align="center">ESN Geel Forms</h1>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img alt="oxlint" src="https://img.shields.io/badge/Lint-oxlint-000000" />
</p>

ESN Forms online builder and publisher for ESN Geel.

Create, update and share your own forms right inside of the application.

## Development

```
npm install
npm run dev
```

## Production build

```
npm run build
```

Outputs a static site to `dist/`, ready to be served by any static host.

## Updating the Google Form

The form field IDs (`entry.*`) and the target Google Form URL live in
[`src/forms/esncard/esncardSchema.ts`](src/forms/esncard/esncardSchema.ts). If the underlying
Google Form changes, update the values there — they must match the Form's field entry IDs
exactly, which you can find by inspecting the Form's own HTML/prefilled link.

## File structure

```
esn/
├── index.html                       Vite entry HTML
├── public/
│   └── favicon.ico                  ESN star icon (browser tab + footer badge)
└── src/
    ├── main.tsx                     React root
    ├── App.tsx                      Page shell/layout: brand strip, logo, socials, card, footer
    ├── index.css                    Tailwind entry + ESN color theme tokens
    ├── components/
    │   ├── FormField.tsx            Generic field renderer (text/date, radio group, acknowledge)
    │   ├── BrandStrip.tsx           Repeating 4-color ESN strip at the top of the page
    │   ├── SocialLinks.tsx          Facebook/Instagram icon buttons
    │   └── Footer.tsx               "About us" section
    ├── forms/esncard/
    │   ├── esncardSchema.ts         Field definitions + Google Form entry IDs/action URL
    │   ├── EsncardHero.tsx          Card header (title, badge, intro copy)
    │   └── EsncardForm.tsx          Assembles FormField components into the full form
    └── lib/
        ├── formSchema.ts            Shared TypeScript field schema types
        └── useGoogleFormSubmit.ts   Submit hook (validates, posts via fetch, tracks status)
```

The schema/hook/component split under `lib/` and `components/` is intentional — future ESN forms
can reuse `FormField` and `useGoogleFormSubmit` instead of hand-building a new form from scratch;
only `forms/esncard/` is specific to this one form.

## License

[MIT](LICENSE)
