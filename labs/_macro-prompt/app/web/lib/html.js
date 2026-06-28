// Shared htm-bound-to-preact tag. One Preact singleton across all components.
import { h } from "preact";
import htm from "htm";
export const html = htm.bind(h);
