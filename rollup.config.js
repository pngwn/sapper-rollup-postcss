import resolve from "rollup-plugin-node-resolve";
import replace from "rollup-plugin-replace";
import commonjs from "rollup-plugin-commonjs";
import svelte from "rollup-plugin-svelte";
import babel from "rollup-plugin-babel";
import { terser } from "rollup-plugin-terser";
import config from "sapper/config/rollup.js";
import pkg from "./package.json";

const mode = process.env.NODE_ENV;
const dev = mode === "development";
const legacy = !!process.env.SAPPER_LEGACY_BUILD;

const tailwind = require("./tailwind.js");

const preprocessOptions = {
	transformers: {
		postcss: {
			plugins: [
				require("postcss-import")(),
				require("postcss-url")(),
				require("tailwindcss")(tailwind),
				require("autoprefixer")({ browsers: "last 4 version" })
			]
		}
	}
};

export default {
	client: {
		input: config.client.input(),
		output: config.client.output(),
		plugins: [
			replace({
				"process.browser": true,
				"process.env.NODE_ENV": JSON.stringify(mode)
			}),
			svelte({
				dev,
				hydratable: true,
				emitCss: true,
				preprocess: require("svelte-preprocess")(preprocessOptions)
			}),
			resolve(),
			commonjs(),

			legacy &&
				babel({
					extensions: [".js", ".html"],
					runtimeHelpers: true,
					exclude: ["node_modules/@babel/**"],
					presets: [
						[
							"@babel/preset-env",
							{
								targets: "> 0.25%, not dead"
							}
						]
					],
					plugins: [
						"@babel/plugin-syntax-dynamic-import",
						[
							"@babel/plugin-transform-runtime",
							{
								useESModules: true
							}
						]
					]
				}),

			!dev &&
				terser({
					module: true
				})
		],

		// temporary, pending Rollup 1.0
		experimentalCodeSplitting: true
	},

	server: {
		input: config.server.input(),
		output: config.server.output(),
		plugins: [
			replace({
				"process.browser": false,
				"process.env.NODE_ENV": JSON.stringify(mode)
			}),
			svelte({
				generate: "ssr",
				dev,
				preprocess: require("svelte-preprocess")(preprocessOptions)
			}),
			resolve(),
			commonjs()
		],
		external: Object.keys(pkg.dependencies).concat(
			require("module").builtinModules ||
				Object.keys(process.binding("natives"))
		),

		// temporary, pending Rollup 1.0
		experimentalCodeSplitting: true
	},

	serviceworker: {
		input: config.serviceworker.input(),
		output: config.serviceworker.output(),
		plugins: [
			resolve(),
			replace({
				"process.browser": true,
				"process.env.NODE_ENV": JSON.stringify(mode)
			}),
			commonjs(),
			!dev && terser()
		]
	}
};
