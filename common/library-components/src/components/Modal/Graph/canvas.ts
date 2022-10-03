import { getDomain } from "../../../common";
import { readingProgressFullClamp } from "../../../store";
import { RuntimeNode } from "./GraphPage";

export function renderNodeObject(darkModeEnabled: boolean, NODE_R: number) {
    // load icons before render
    // const highlightsIcon = new Image();
    // highlightsIcon.src = "/highlights.svg";

    return (
        node: RuntimeNode,
        ctx: CanvasRenderingContext2D,
        globalScale: number
    ) => {
        // empty circle for unread nodes
        if (
            node.reading_progress < readingProgressFullClamp &&
            node.depth !== 0
        ) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, NODE_R * 0.6, 0, 2 * Math.PI);
            ctx.fillStyle = darkModeEnabled ? "#212121" : "rgb(250, 250, 249)";

            ctx.fill();
        } else if (globalScale >= 2) {
            // annotation count
            const fontSize = 4;
            ctx.font = `bold ${fontSize}px Poppins, Sans-Serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = darkModeEnabled ? "rgb(232, 230, 227)" : "#374151";
            const dimensions = ctx.measureText("5");

            // const svgSize = 4;
            // ctx.drawImage(
            //     highlightsIcon,
            //     node.x - svgSize / 2,
            //     node.y - svgSize / 2,
            //     svgSize,
            //     svgSize
            // );
            ctx.fillText(
                "5",
                node.x,
                node.y +
                    (dimensions.actualBoundingBoxAscent -
                        dimensions.actualBoundingBoxDescent) /
                        2
            );
        }

        // description
        if (
            node.depth <= 1 &&
            globalScale >= 2
            // (node.depth <= 2 && globalScale >= 3) ||
            // globalScale >= 5
        ) {
            // title label
            if (!node.title) {
                return;
            }

            let label = node.title?.slice(0, 40);
            if (node.title.length > 40) {
                label = label.concat("…");
            }

            const fontSize = 13 / globalScale;
            ctx.font = `bold ${fontSize}px Poppins, Sans-Serif`;

            // const rectWith = titleDimensions.width + 10;
            // const rectHeight = 50;
            // ctx.fillStyle = "white";
            // roundedRect(
            //     ctx,
            //     node.x - rectWith / 2,
            //     node.y + 5,
            //     rectWith,
            //     rectHeight,
            //     3
            // );
            // ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
            // ctx.shadowOffsetX = 0;
            // ctx.shadowOffsetY = 1;
            // ctx.shadowBlur = 10;
            // ctx.fill();
            // ctx.shadowColor = "transparent";

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = darkModeEnabled ? "rgb(232, 230, 227)" : "#374151";
            ctx.fillText(label, node.x, node.y + 5);

            // ctx.font = `${fontSize}px Poppins, Sans-Serif`;
            // ctx.fillText(getDomain(node.url), node.x, node.y + 20);
            // ctx.fillText(node.publication_date || "", node.x, node.y + 30);
        }
    };
}

function roundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}
