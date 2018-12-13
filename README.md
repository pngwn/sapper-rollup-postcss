# sapper-rollup-postcss

A default sapper-rollup template with additional CSS processing.

This template is identical to the rollup sapper-template but with additional CSS processors: [postcss](https://postcss.org/), [tailwind](https://tailwindcss.com/), and [autoprefixer](https://autoprefixer.github.io/). Clone the repo, install it with [degit](https://github.com/Rich-Harris/degit), or follow the instructions below to integrate the CSS processors into an existing project.

A word of warning: because of how svelte-preprocessors and tailwind both work, the build time when using tailwind is very, very slow.

If you use [webpack](https://webpack.js.org/), then check out [the webpack version](https://github.com/pngwn/sapper-webpack-postcss).

## Install

```bash
npx degit pngwn/sapper-rollup-postcss my-app
cd my-app
```

```bash
npm install # or yarn
npm run dev
```

The build process is very slow because tailwind basically pumps out every style in its library. So don't worry if the `dev` or `build` scripts take a while. _Do_ worry if you actually decide to develop like this because you won't get any work done.

## In an existing project

Svelte expects the CSS that it processes during compilation to be normal CSS, so if we want to use CSS processors we need to perform these transforms using `svelte.preprocess`. This way, they're all done before Svelte knows anything weird is happening.

In rollup we'll use the `preprocess` option of rollup-plugin-svelte but first we need to install [svelte-preprocess](https://github.com/kaisermann/svelte-preprocess#readme) and postcss. I'll add the [postcss-import](https://github.com/postcss/postcss-import) and [postcss-url](https://github.com/postcss/postcss-url) plugins here too as they are very common.

```bash
npm i -D svelte-preprocess postcss postcss-import postcss-url
```

At the top of `rollup.config.js` we will define our svelte-preprocess options. We just need an object with a `transformers` property to get things started, this is how we define our postcss plugins:

```js
const preprocessOptions = {
    transformers: {
        postcss: {
            plugins: [require("postcss-import")(), require("postcss-url")()]
        }
    }
};
```

Now we need to actually use our preprocessor. Find the rollup-plugin-svelte options for the client config, we will add svelte-preprocess here, passing in the options we defined earlier:

```diff
svelte({
    dev,
    hydratable: true,
    emitCss: true,
+   preprocess: require("svelte-preprocess")(
+       preprocessOptions
+   )
}),
```

We also need to do the same for the server config further down:

```diff
svelte({
    generate: "ssr",
    dev,
+   preprocess: require("svelte-preprocess")(
+       preprocessOptions
+   )
}),
```

You should now have a working postcss preprocessor (yeah, I know), `@import` statements should work inside html `style` blocks.

## Adding autoprefixer

Order is import when we're using these kinds of transforms. Our postcss-import and postcss-url plugins need to come first. Autoprefixer will usually need to come last. Adding this plugin is pretty straightforward.

Install it:

```bash
npm i -D autoprefixer
```

Add it to the list:

```diff
const preprocessOptions = {
  transformers: {
    postcss: {
      plugins: [
        require("postcss-import")(),
        require("postcss-url")(),
+       require("autoprefixer")({ browsers: "last 4 version" })
      ]
    }
  }
};
```

And now you have fancy prefixes.

## Putting the (tail)wind in your sails

Tailwind is a little more involved but nothing crazy.

Install it:

```bash
npm i -D tailwindcss
```

We will need a `tailwind.js` config file: generate it however you normally would and put it somewhere you can find it. We need to require this and pass it into `tailwindcss` when we add it as a postcss plugin. We are going to put tailwind just before autoprefixer because we don't want everything to set on fire.

```diff
+ const tailwind = require("./tailwind.js");

const preprocessOptions = {
  transformers: {
    postcss: {
      plugins: [
        require("postcss-import")(),
        require("postcss-url")(),
+       require("tailwindcss")(tailwind),
        require("autoprefixer")({ browsers: "last 4 version" })
      ]
    }
  }
};
```

In principle this is 'working' but we need to do more. We should make a `_tailwind.css` file (call it whatever you want) that looks something like this:

```css
@tailwind preflight;
@tailwind components;
@tailwind utilities;
@tailwind screens;
```

Now we can import this file into the style block of any component `@import './_tailwind.css';` and do as much weird tailwind stuff as we want. You could also define these tailwind directives directly inside your style block as well. I won't judge you.

I know nothing about tailwind or postcss but this seems to work. If something doesn't work for you, let me know and I'll take a look at it.
