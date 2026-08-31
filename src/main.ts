/**
 * Application entry point.
 *
 * Mounts the root {@link App} Svelte component into the `#app` element.
 */
import './app.css'
import App from './App.svelte'

const app = new App({
  target: document.getElementById('app')!,
})

export default app
