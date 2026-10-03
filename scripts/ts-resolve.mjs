// lets node run the studio's typescript with extensionless relative imports, the way next resolves them
import { register } from "node:module";

register("./ts-resolve-hooks.mjs", import.meta.url);
