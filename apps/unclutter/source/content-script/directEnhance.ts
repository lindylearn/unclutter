import { boot } from "./boot";
import { enhance } from "./enhance";

window.onload = () => {
    // Disable page JavaScript (Remove all <script>)
    const scripts = document.getElementsByTagName("script");
    for (let script of scripts) {
        script.remove();
        console.log(script);
    }
};

// Boot up unclutter then enhance the current page using unclutter
boot()
    .then(() => {
        enhance();
    })
    .catch((err: any) => {
        console.log(err.message);
    });
