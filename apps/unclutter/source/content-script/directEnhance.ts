import { boot } from "./boot";
import { enhance } from "./enhance";

// Boot up unclutter then enhance the current page using unclutter
boot()
    .then(() => {
        enhance();
    })
    .catch((err: any) => {
        console.log(err.message);
    });
