import { NodeObject, LinkObject } from "force-graph";

import { Article, ArticleLink, readingProgressFullClamp } from "../../../store";

export type CustomGraphData = {
    nodes: CustomGraphNode[];
    links: CustomGraphLink[];
};
export type CustomGraphNode = NodeObject &
    Article & {
        depth: number;
        linkCount: number;
        days_ago: number;
    };
export type CustomGraphLink = LinkObject & {
    depth?: number;
};

export async function constructGraphData(
    nodes: Article[],
    links: ArticleLink[],
    articleUrl: string
): Promise<CustomGraphData> {
    // only consider links of filtered articles
    const nodeIndexById = nodes.reduce((acc, node, index) => {
        acc[node.id] = index;
        return acc;
    }, {});
    links = links.filter(
        (l) =>
            nodeIndexById[l.source] !== undefined &&
            nodeIndexById[l.target] !== undefined
    );

    // save links per node
    const linksPerNode: { [id: string]: ArticleLink[] } = {};
    links.map((l) => {
        // save both directions to find all connections using linksPerNode
        linksPerNode[l.source] = [...(linksPerNode[l.source] || []), l];
        linksPerNode[l.target] = [...(linksPerNode[l.target] || []), l];
    });

    // filter number of links per node
    const customLinks: CustomGraphLink[] = [];
    const filteredLinksPerNode: { [id: string]: ArticleLink[] } = {};
    for (const [id, ls] of Object.entries(linksPerNode)) {
        const filteredLinks = ls
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 2);

        // console.log(filteredLinks);

        for (const l of filteredLinks) {
            if (l["_index"] !== undefined) {
                // skip duplicate links
                continue;
            }
            l["_index"] = customLinks.length;
            customLinks.push(l);
            l["depth"] = 100;

            filteredLinksPerNode[l.source] = [
                ...(filteredLinksPerNode[l.source] || []),
                l,
            ];
            filteredLinksPerNode[l.target] = [
                ...(filteredLinksPerNode[l.target] || []),
                // reverse link for BFS below
                {
                    ...l,
                    source: l.target,
                    target: l.source,
                },
            ];
        }
    }

    const customNodes: CustomGraphNode[] = nodes.map((node, index) => {
        return {
            ...node,
            linkCount: filteredLinksPerNode[node.id]?.length || 0,
            days_ago: (Date.now() - node.time_added * 1000) / 86400000,
            depth: 100, // makes depth checks easier
        };
    });

    // spanning tree
    // const mstLinks = kruskal(
    //     customLinks.map((l) => ({
    //         ...l,
    //         from: l.source,
    //         to: l.target,
    //         weight: 1 - l.score!,
    //     }))
    // );
    // setGraph({ nodes :customNodes, links: mstLinks });

    // add depth from current url
    const maxDepth = 5;
    const startNode = customNodes.find((n) => n.url === articleUrl);
    if (startNode) {
        startNode.depth = 0;
        const queue = [startNode];
        while (queue.length > 0) {
            const node = queue.shift();
            if (!node || (node.depth !== 100 && node.depth >= maxDepth)) {
                break;
            }

            const adjacentLinks = filteredLinksPerNode[node.id] || [];
            adjacentLinks.map((l) => {
                const targetNode = customNodes[nodeIndexById[l.target]];
                if (targetNode && targetNode.depth === 100) {
                    targetNode.depth = node.depth + 1;
                    customLinks[l["_index"]].depth = node.depth + 1;

                    queue.push(targetNode);
                }
            });
        }
    }

    return { nodes: customNodes, links: customLinks };
}
