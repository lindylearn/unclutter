import { Link } from "wouter";

export function EmptyLibraryMessage() {
    return (
        <div>
            To add articles to your library, activate{" "}
            <a
                className="inline-block cursor-pointer font-bold transition-all hover:rotate-1"
                href="https://unclutter.lindylearn.io"
                target="_blank"
                rel="noreferrer"
            >
                Unclutter
            </a>{" "}
            on web pages or{" "}
            <Link to="/import">
                <a className="inline-block cursor-pointer font-bold transition-all hover:rotate-1">
                    manually import articles
                </a>
            </Link>
            .
        </div>
    );
}

export function NoTopicsMessage() {
    return (
        <div className="col-span-6">
            Library topics become available once you import at least 20 articles.
        </div>
    );
}

export function NoFavoritesMessage() {
    return <div>Click the star icon on articles to make them appear here.</div>;
}
