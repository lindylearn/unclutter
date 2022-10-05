import { getDomain } from "../../../common";
import { readingProgressFullClamp, Topic } from "../../../store";
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
        ctx.shadowColor = "transparent";

        // empty circle for unread nodes
        if (!node.isCompleted) {
            ctx.beginPath();
            const nodeValMod = node.depth === 0 ? 1.5 : 1;
            ctx.arc(node.x, node.y, NODE_R * 0.6 * nodeValMod, 0, 2 * Math.PI);
            ctx.fillStyle = darkModeEnabled
                ? "rgb(38, 38, 38)"
                : "rgb(250, 250, 249)";
            // ctx.fillStyle = darkModeEnabled ? "rgb(19, 21, 22)" : "white";

            ctx.fill();
        } else if (false && globalScale >= 1.5) {
            // annotation count
            const fontSize = 5;
            ctx.font = `bold ${fontSize}px Poppins, Sans-Serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = darkModeEnabled ? "rgb(232, 230, 227)" : "#374151";
            const dimensions = ctx.measureText("5");

            // const svgSize = 4;
            // const middleOffset = svgSize / 2 - 0.25;
            // ctx.drawImage(
            //     highlightsIcon,
            //     node.x - svgSize / 2 - middleOffset,
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
            ((node.depth <= 1 || node.isCompleted) && globalScale >= 2) ||
            ((node.depth <= 2 || node.isCompletedAdjacent) &&
                globalScale >= 3) ||
            globalScale >= 5
        ) {
            if (!node.title) {
                return;
            }

            let label = node.title?.slice(0, 40);
            if (node.title.length > 40) {
                label = label.concat("…");
            }

            // const topic = topicsById[node.topic_id || ""];
            // let label = topic.id.startsWith("-")
            //     ? `${topic.id} ${topic?.name}`
            //     : topic?.name;

            const fontSize = 13 / globalScale;
            if (node.depth === 0) {
                ctx.font = `bold ${fontSize}px Poppins, Sans-Serif`;
            } else {
                ctx.font = `${fontSize}px Work Sans, Sans-Serif`;
            }

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
            ctx.fillStyle = darkModeEnabled
                ? "rgb(232, 230, 227)"
                : "rgb(41, 37, 36)";
            ctx.fillText(label, node.x, node.y + (node.isCompleted ? 7 : 5));

            // ctx.font = `${fontSize}px Poppins, Sans-Serif`;
            // ctx.fillText(getDomain(node.url), node.x, node.y + 20);
            // ctx.fillText(node.publication_date || "", node.x, node.y + 30);
        }

        ctx.shadowColor = "rgba(0, 0, 0, 0.05)";
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 5;
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
