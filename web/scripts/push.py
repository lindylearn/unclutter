import requests
import json
import time
import os

# REPLICACHE_HOST = "http://localhost:3000/api/replicache"
# REPLICACHE_HOST = "https://library.lindylearn.io/api/replicache"
REPLICACHE_HOST = "https://unclutter-library-ooua5poyq-phgn0.vercel.app/api/replicache"


def push_topics(used_topics, space_id):
    mutations = []
    for index, topic in enumerate(used_topics):
        mutation = {
            "id": index + 1, 
            "name": "putTopic",
            "args": {
                "id": f"{topic['cluster_id']}_", # ending with _ to query by prefix
                "name": topic.get("topic_name") if topic.get("topic_name") else "" # handle None
            }
        }

        if topic.get("topic_name_emoji"):
            mutation["args"]["emoji"] = topic["topic_name_emoji"]
        if topic.get("parent_topic_id") is not None:
            mutation["args"]["parent_topic_id"] = f"{topic['parent_topic_id']}_"

        mutations.append(mutation)

    _push_mutations(mutations, space_id)


def push_articles(articles, space_id):
    mutations = []
    for index, article in enumerate(articles):
        mutations.append({
            "id": index + 1, 
            "name": "putArticleIfNotExists",
            "args": {
                "id": f"{article['url']}",
                "url": article["url"],
                "title": article.get("title", ""),
                "word_count": article.get("word_count", 0),
                "time_added": article.get("time_added", 0),
                "reading_progress": article.get("status", 0),
                "topic_id": f"{updated_topic_ids.get(str(article['label']), article['label'])}_"
            }
        })

    _push_mutations(mutations, space_id)

def _push_mutations(mutations, space_id):
    response = requests.post(f"{REPLICACHE_HOST}/push?spaceID={space_id}", json={
        "clientID": f"automated-uploads-{int(time.time())}",
        "profileID": "automated-uploads-profile",
        "pushVersion": "0",
        "schemaVersion": "0",
        "mutations": mutations
    }, headers={
        "Content-Type": "application/json",
        "Api-token": os.environ["AUTOMATED_API_TOKEN"]
    })
    if not response.ok:
        raise Exception(f"Failed to push changes to replicache: {response.text}")


user_id = "33524c64-561c-4463-9d91-939fb22fad6e"

with open("./selected_articles.json", "r") as file:
    articles = json.loads(file.read())
with open("./updated_topic_ids.json", "r") as file:
    updated_topic_ids = json.loads(file.read())
with open("./flat_topics.json", "r") as file:
    used_topics = json.loads(file.read())

push_topics(used_topics, space_id = user_id)
print(f"Pushed {len(used_topics)} topics")
push_articles(articles[:100000], space_id = user_id)
print(f"Pushed {len(articles)} articles")
