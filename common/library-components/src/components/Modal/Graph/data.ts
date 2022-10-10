import { NodeObject, LinkObject } from "force-graph";

import {
    Article,
    ArticleLink,
    readingProgressFullClamp,
    Topic,
} from "../../../store";

export type CustomGraphData = {
    nodes: CustomGraphNode[];
    links: CustomGraphLink[];
};
export type CustomGraphNode = NodeObject &
    Article & {
        depth: number;
        linkCount: number;
        days_ago: number;
        isCompleted: boolean;
        isCompletedAdjacent: boolean;
    };
export type CustomGraphLink = LinkObject & {
    depth: number;
    isCompletedAdjacent: boolean;
};

export async function constructGraphData(
    nodes: Article[],
    links: ArticleLink[],
    articleUrl?: string,
    topi?: Topic
): Promise<[CustomGraphData, number]> {
    // populate custom node data
    const customNodes: CustomGraphNode[] = nodes
        // .filter((n) => !n.topic_id?.startsWith("-"))
        // .filter((n) => n.topic_id === topic.id)
        .map((node, index) => {
            return {
                ...node,
                days_ago: (Date.now() - node.time_added * 1000) / 86400000,
                isCompleted: node.reading_progress > readingProgressFullClamp,
                // populated later
                isCompletedAdjacent: false,
                linkCount: 0,
                depth: 100, // makes depth checks easier
            };
        });

    // only consider links of filtered articles
    const nodeById: { [nodeId: string]: CustomGraphNode } = customNodes.reduce(
        (acc, node, index) => {
            node["_index"] = index;
            acc[node.id] = node;
            return acc;
        },
        {}
    );
    links = links.filter(
        (l) =>
            nodeById[l.source] !== undefined && nodeById[l.target] !== undefined
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
    for (const [nodeId, ls] of Object.entries(linksPerNode)) {
        const filteredLinks = ls
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 3);

        nodeById[nodeId].linkCount = filteredLinks.length;

        for (const l of filteredLinks) {
            if (l["_index"] !== undefined) {
                // skip duplicate links
                continue;
            }

            // save direct adjacency state
            const source = nodeById[l.source];
            const target = nodeById[l.target];
            const isCompletedAdjacent =
                (source.isCompleted || target.isCompleted) &&
                source.topic_id === target.topic_id;
            if (isCompletedAdjacent) {
                source.isCompletedAdjacent = true;
                target.isCompletedAdjacent = true;
            }

            // create custom link object
            l["_index"] = customLinks.length;
            customLinks.push({
                ...l,
                depth: 100,
                isCompletedAdjacent,
            });

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

    // add depth from current url
    const maxDepth = 3;
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
                const targetNode = nodeById[l.target];
                if (targetNode && targetNode.depth === 100) {
                    targetNode.depth = node.depth + 1;
                    customLinks[l["_index"]].depth = node.depth + 1;

                    queue.push(targetNode);
                }
            });
        }
    }

    // remove left-over bidirectional connections (which are used for BFS above)
    const seenConnections = new Set<string>();
    const deduplicatedLinks = customLinks.filter((l) => {
        if (seenConnections.has(`${l.target}-${l.source}`)) {
            return false;
        }
        seenConnections.add(`${l.source}-${l.target}`);
        return true;
    });

    // count links shown in the graph (single topic)
    const activeArticleTopicLinkCount = deduplicatedLinks.filter((l) => {
        if (l.depth === 1) {
            const source = nodeById[l.source as string];
            const target = nodeById[l.target as string];
            return source.topic_id === target.topic_id;
        }
        return false;
    }).length;

    return [
        { nodes: customNodes, links: deduplicatedLinks },
        activeArticleTopicLinkCount,
    ];
}
