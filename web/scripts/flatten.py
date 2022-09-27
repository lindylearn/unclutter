import json
from collections import defaultdict

topics_mapped_to = defaultdict(list)
def flatten_nesting(node, leaf_node_threshold, min_children_count, flatten_lambda_threshold):
    article_count = topic_article_count[node['cluster_id']]

    flattened_children = []
    for child in node['children']:
        flattened_child, recursive_child_article_count = flatten_nesting(child, leaf_node_threshold, min_children_count, flatten_lambda_threshold)
        if recursive_child_article_count == 0:
            continue

        direct_article_count = sum([topic_article_count[cluster_id] for cluster_id in [flattened_child['cluster_id']] + topics_mapped_to[flattened_child['cluster_id']]])
        child_child_count = len(flattened_child['children'])

        # if child['cluster_id'] == 125:
        #     print(flattened_child)

        if recursive_child_article_count < leaf_node_threshold:
            # map small child nodes to parent
            topics_mapped_to[node['cluster_id']] += [child['cluster_id']]
            topics_mapped_to[node['cluster_id']] += topics_mapped_to[child['cluster_id']]
            del topics_mapped_to[child['cluster_id']]
        elif child_child_count == 0:
            # use all large leaf clusters
            flattened_children.append(flattened_child)
        elif child_child_count == 1 and direct_article_count <= 1:
            single_child_child = flattened_child['children'][0]
            
            # take most specific id
            print(f"flattening {flattened_child['cluster_id']} -> {single_child_child['cluster_id']}\t")
            topics_mapped_to[single_child_child['cluster_id']] += [flattened_child['cluster_id']]
            topics_mapped_to[single_child_child['cluster_id']] += topics_mapped_to[flattened_child['cluster_id']]
            del topics_mapped_to[flattened_child['cluster_id']]

            single_child_child['lambda_duration'] += flattened_child['lambda_duration']
            flattened_child = single_child_child

            flattened_children.append(flattened_child)
        elif child_child_count == 1 and direct_article_count > 0:
            single_child_child = flattened_child['children'][0]

            # take parent id
            print(f"flattening {single_child_child['cluster_id']} -> {flattened_child['cluster_id']}\t({direct_article_count})")
            flattened_child['children'] = single_child_child['children']
            flattened_children.append(flattened_child)

            topics_mapped_to[child['cluster_id']] += [single_child_child['cluster_id']]
            topics_mapped_to[child['cluster_id']] += topics_mapped_to[single_child_child['cluster_id']]
            del topics_mapped_to[single_child_child['cluster_id']]

        # elif child_child_count < min_children_count or child['lambda_duration'] < flatten_lambda_threshold or article_count == 0:
        #     # move-up children of shallow nodes or otherwise empty nodes
        #     flattened_children.extend(flattened_child['children'])

        #     # move to parent
        #     topics_mapped_to[node['cluster_id']] += [child['cluster_id']]
        #     topics_mapped_to[node['cluster_id']] += topics_mapped_to[child['cluster_id']]
        #     del topics_mapped_to[child['cluster_id']]
        else:
            # save large group nodes
            flattened_children.append(flattened_child)

        article_count += recursive_child_article_count

    node['children'] = flattened_children

    return node, article_count

top_level_groups = []
def extract_groups(node, lambda_threshold, childen_threshold):
    leaf_nodes = [node] # include direct node data points
    
    for child in node['children']:
        if len(child['children']) == 0:
            # leaf node
            leaf_nodes.append(child)
        else:
            # recurse for hierarchical nodes
            leaf_nodes.extend(extract_groups(child, lambda_threshold, childen_threshold))
    
    # node['cluster_id'] == 0
    if (node['lambda_duration'] >= lambda_threshold and len(leaf_nodes) > 2) or len(leaf_nodes) >= childen_threshold:
        # save large or well-defined groups at top level
        top_level_groups.append(leaf_nodes)
        return []
    else:
        # otherwise flatten to parent
        return leaf_nodes

def create_group_nesting():
    # update labels, create new group clusters
    nesting_objs = []
    for _, children in enumerate(top_level_groups):
        original_container = children[0]
        flat_children = []
        for child in children:
            # move all "other" to group "other"
            if child['children']:
                # print(f"Moving direct children to group {child['cluster_id']} -> {original_container['cluster_id']}")
                topics_mapped_to[original_container['cluster_id']].append(child['cluster_id'])
                continue

            child_copy = child.copy()
            child_copy['children'] = []
            flat_children.append(child_copy)

        new_id = original_container['cluster_id']
        print(f"G{new_id}: {str(original_container['lambda_duration'])[:5]} lambda, {len(flat_children)} children")

        group_obj = original_container.copy()
        group_obj['children'] = flat_children
        nesting_objs.append(group_obj)

    return {
        'cluster_id': None,
        'lambda_duration': 0,
        'recursive_count': None,
        'children': nesting_objs,
    }


topic_article_count = defaultdict(int)
def main():
    # read data
    with open("./selected_articles.json", "r") as file:
        articles = json.loads(file.read())[:300]
        for article in articles:
            topic_article_count[article['label']] += 1
    with open("./nesting_raw.json", "r") as file:
        nesting_raw = json.loads(file.read())    

    # flatten
    # use lambda rather than children count (except for single children)
    # nesting_flattened, _ = flatten_nesting(nesting_raw, leaf_node_threshold=2, min_children_count=1, flatten_lambda_threshold=0.0)
    nesting_flattened = nesting_raw

    extract_groups(nesting_flattened, lambda_threshold=1000, childen_threshold=6) # 0.4
    nesting_groups = create_group_nesting()

    # write data
    with open("./nesting.json", "w") as file:
        # file.write(json.dumps(nesting_flattened, indent=4))
        file.write(json.dumps(nesting_groups, indent=4))
    
    # reverse map
    topic_mappings = {}
    for new_topic, old_topics in topics_mapped_to.items():
        for old_topic in old_topics:
            topic_mappings[old_topic] = new_topic
    with open("./updated_topic_ids.json", "w") as file:
        file.write(json.dumps(topic_mappings, indent=4))


    # TODO this seems to include empty topics
    used_topics = []
    for group in top_level_groups:
        for i, topic in enumerate(group):
            topic['children'] = None
            topic['parent_topic_id'] = group[0]['cluster_id'] if i != 0 else None
            used_topics.append(topic)
    if used_topics:
        print(f"Using {len(used_topics)} topics for {len(articles)} articles (average {len(articles) / len(used_topics)})")

    with open("./flat_topics.json", "w") as file:
        file.write(json.dumps(used_topics, indent=4))

main()
