import { SearchIndex } from "@unclutter/library-components/dist/common";
import { expose as exposeWorker } from "comlink";

console.log("Worker started");
const index = new SearchIndex();

onconnect = function (event) {
    const port = event.ports[0];
    exposeWorker(index, port);
};
