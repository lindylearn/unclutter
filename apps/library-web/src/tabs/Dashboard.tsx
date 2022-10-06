import clsx from "clsx";
import { useContext, useEffect, useState } from "react";
import { GroupedArticleList } from "@unclutter/library-components/dist/components";
import {
    ArticleBucket,
    ArticleBucketMap,
    StateFilter,
    ReplicacheContext,
    Article,
    useSubscribe,
} from "@unclutter/library-components/dist/store";

export default function DashboardTab({ selectedTopicId, setSelectedTopicId }) {
    // list filters
    const [stateFilter, setStateFilter] = useState<StateFilter>(
        stateFilters[0].value
    );
    const [activeKey, setActiveKey] = useState<string | null>(null);

    // fetch articles to local state using filters
    const rep = useContext(ReplicacheContext);
    const articleGroups = useSubscribe(
        rep,
        rep?.subscribe.groupRecentArticles(
            undefined,
            stateFilter,
            selectedTopicId
        ),
        null,
        [stateFilter, selectedTopicId]
    ) as ArticleBucketMap | null;

    // order time buckets for sidebar
    const [timeFilterOptions, setTimeFilterOptions] =
        useState<TimeFilterOptions[]>();
    useEffect(() => {
        if (!articleGroups) {
            return;
        }
        function countArticles(bucket: ArticleBucket): TimeFilterOptions {
            const children = bucket.children?.map(countArticles);
            return {
                ...bucket,
                articleCount:
                    bucket.articles?.length ||
                    children?.reduce(
                        (acc, cur) => acc + cur.articleCount!,
                        0
                    ) ||
                    0,
                children,
            };
        }
        const timeFilterOptions = Object.values(articleGroups)
            ?.sort((a, b) => (b.key > a.key ? 1 : -1))
            .map((bucket) => countArticles(bucket));
        const allTimeOption: TimeFilterOptions = {
            key: "all",
            title: "All time",
            articleCount: timeFilterOptions.reduce(
                (acc, bucket) => acc + (bucket.articleCount || 0),
                0
            ),
        };

        setTimeFilterOptions([allTimeOption].concat(timeFilterOptions));

        if (!activeKey) {
            setActiveKey(timeFilterOptions[0]?.children?.[0].key || null);
        }
    }, [articleGroups]);

    // parse shown articles
    const [visibleArticles, setVisibleArticles] = useState<Article[] | null>();
    useEffect(() => {
        if (articleGroups && activeKey) {
            if (activeKey === "all") {
                setVisibleArticles(
                    Object.values(articleGroups).flatMap((bucket) =>
                        (bucket.articles || []).concat(
                            bucket.children?.flatMap(
                                (child) => child.articles || []
                            ) || []
                        )
                    )
                );
            } else if (articleGroups[activeKey]?.articles) {
                setVisibleArticles(articleGroups[activeKey].articles || null);
            } else if (!activeKey.includes("-")) {
                // year bucket
                setVisibleArticles(
                    articleGroups[activeKey]?.children?.flatMap(
                        (b) => b.articles || []
                    ) || null
                );
                return;
            } else {
                const year = activeKey.split("-")[0];
                let bucket = articleGroups[year]?.children?.find(
                    (c) => c.key === activeKey
                );
                if (!bucket) {
                    setVisibleArticles(null);
                    return;
                }

                setVisibleArticles(bucket.articles || null);
            }
        } else {
            setVisibleArticles(null);
        }
    }, [articleGroups, activeKey]);

    return (
        <main className="w-full p-3">
            {/* {visibleArticles === null && (
                <div className="">
                    <EmptyLibraryMessage />
                </div>
            )} */}

            <aside className="fixed flex h-full w-44 flex-col gap-3">
                <SidebarFilterList
                    stateFilter={stateFilter}
                    setStateFilter={setStateFilter}
                />
                {timeFilterOptions && (
                    <div className="animate-fadein flex flex-col items-stretch gap-1 rounded-lg bg-white p-2.5 shadow dark:bg-stone-800">
                        {timeFilterOptions.map((bucket) => (
                            <SidebarBucketGroup
                                {...bucket}
                                bucketKey={bucket.key}
                                activeKey={activeKey}
                                setActiveKey={setActiveKey}
                                isCollapsedInitial={bucket.key !== "2022"}
                            />
                        ))}
                    </div>
                )}
            </aside>

            <main className="w-full pl-44">
                <div className="pl-3">
                    <GroupedArticleList
                        articles={visibleArticles || []}
                        sortGroupsBy="recency_position"
                        setSelectedTopicId={setSelectedTopicId}
                        combineSmallGroups
                    />
                </div>
            </main>
        </main>
    );
}

export interface FilterOption {
    label: string;
    value: StateFilter;
    svg: React.ReactNode;
}
const stateFilters: FilterOption[] = [
    {
        label: "All articles",
        value: "all",
        svg: (
            <svg viewBox="0 0 576 512" className="h-4">
                <path
                    fill="currentColor"
                    d="M88 32C110.1 32 128 49.91 128 72V120C128 142.1 110.1 160 88 160H40C17.91 160 0 142.1 0 120V72C0 49.91 17.91 32 40 32H88zM88 72H40V120H88V72zM88 192C110.1 192 128 209.9 128 232V280C128 302.1 110.1 320 88 320H40C17.91 320 0 302.1 0 280V232C0 209.9 17.91 192 40 192H88zM88 232H40V280H88V232zM0 392C0 369.9 17.91 352 40 352H88C110.1 352 128 369.9 128 392V440C128 462.1 110.1 480 88 480H40C17.91 480 0 462.1 0 440V392zM40 440H88V392H40V440zM248 32C270.1 32 288 49.91 288 72V120C288 142.1 270.1 160 248 160H200C177.9 160 160 142.1 160 120V72C160 49.91 177.9 32 200 32H248zM248 72H200V120H248V72zM160 232C160 209.9 177.9 192 200 192H248C270.1 192 288 209.9 288 232V280C288 302.1 270.1 320 248 320H200C177.9 320 160 302.1 160 280V232zM200 280H248V232H200V280zM248 352C270.1 352 288 369.9 288 392V440C288 462.1 270.1 480 248 480H200C177.9 480 160 462.1 160 440V392C160 369.9 177.9 352 200 352H248zM248 392H200V440H248V392zM320 72C320 49.91 337.9 32 360 32H408C430.1 32 448 49.91 448 72V120C448 142.1 430.1 160 408 160H360C337.9 160 320 142.1 320 120V72zM360 120H408V72H360V120zM408 192C430.1 192 448 209.9 448 232V280C448 302.1 430.1 320 408 320H360C337.9 320 320 302.1 320 280V232C320 209.9 337.9 192 360 192H408zM408 232H360V280H408V232zM320 392C320 369.9 337.9 352 360 352H408C430.1 352 448 369.9 448 392V440C448 462.1 430.1 480 408 480H360C337.9 480 320 462.1 320 440V392zM360 440H408V392H360V440z"
                />
            </svg>
        ),
    },
    {
        label: "Unread",
        value: "unread",
        svg: (
            <svg viewBox="0 0 576 512" className="h-4">
                <path
                    fill="currentColor"
                    d="M0 73.7C0 50.67 18.67 32 41.7 32H470.3C493.3 32 512 50.67 512 73.7C512 83.3 508.7 92.6 502.6 100L336 304.5V447.7C336 465.5 321.5 480 303.7 480C296.4 480 289.3 477.5 283.6 472.1L191.1 399.6C181.6 392 176 380.5 176 368.3V304.5L9.373 100C3.311 92.6 0 83.3 0 73.7V73.7zM54.96 80L218.6 280.8C222.1 285.1 224 290.5 224 296V364.4L288 415.2V296C288 290.5 289.9 285.1 293.4 280.8L457 80H54.96z"
                />
            </svg>
        ),
    },
    {
        label: "Favorites",
        value: "favorite",
        svg: (
            <svg viewBox="0 0 576 512" className="h-4">
                <path
                    fill="currentColor"
                    d="M287.9 0C297.1 0 305.5 5.25 309.5 13.52L378.1 154.8L531.4 177.5C540.4 178.8 547.8 185.1 550.7 193.7C553.5 202.4 551.2 211.9 544.8 218.2L433.6 328.4L459.9 483.9C461.4 492.9 457.7 502.1 450.2 507.4C442.8 512.7 432.1 513.4 424.9 509.1L287.9 435.9L150.1 509.1C142.9 513.4 133.1 512.7 125.6 507.4C118.2 502.1 114.5 492.9 115.1 483.9L142.2 328.4L31.11 218.2C24.65 211.9 22.36 202.4 25.2 193.7C28.03 185.1 35.5 178.8 44.49 177.5L197.7 154.8L266.3 13.52C270.4 5.249 278.7 0 287.9 0L287.9 0zM287.9 78.95L235.4 187.2C231.9 194.3 225.1 199.3 217.3 200.5L98.98 217.9L184.9 303C190.4 308.5 192.9 316.4 191.6 324.1L171.4 443.7L276.6 387.5C283.7 383.7 292.2 383.7 299.2 387.5L404.4 443.7L384.2 324.1C382.9 316.4 385.5 308.5 391 303L476.9 217.9L358.6 200.5C350.7 199.3 343.9 194.3 340.5 187.2L287.9 78.95z"
                />
            </svg>
        ),
    },
];
export function SidebarFilterList({ stateFilter, setStateFilter }) {
    return (
        <div className="animate-fadein flex flex-col items-stretch gap-1 rounded-lg bg-white p-2.5 shadow dark:bg-stone-800">
            {stateFilters.map((option) => (
                <SidebarFilterOption
                    key={option.value}
                    {...option}
                    isActive={option.value === stateFilter}
                    onClick={() => setStateFilter(option.value)}
                />
            ))}
        </div>
    );
}

function SidebarFilterOption({
    label,
    svg,
    isActive = false,
    onClick = () => {},
}) {
    return (
        <div
            className={clsx(
                "font-title flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 shadow-sm outline-none transition-all hover:scale-[96%]",
                isActive
                    ? "bg-stone-200 dark:bg-stone-700"
                    : "bg-stone-100 dark:bg-stone-800"
            )}
            onClick={onClick}
        >
            {svg}
            {label}
        </div>
    );
}

interface TimeFilterOptions {
    key: string;
    title: string;
    articleCount?: number;
    children?: TimeFilterOptions[];
}
function SidebarBucketGroup({
    bucketKey,
    title,
    children = undefined,
    articleCount = undefined,
    activeKey,
    setActiveKey,
    isCollapsedInitial = true,
}: TimeFilterOptions & {
    bucketKey: string;
    activeKey: string | null;
    setActiveKey: (key: string) => void;
    isCollapsedInitial?: boolean;
}) {
    const [isCollapsed, setIsCollapsed] = useState(isCollapsedInitial);
    const isActive = activeKey === bucketKey;

    const showChildren = children && (!articleCount || articleCount > 20);
    return (
        <div className="w-full">
            <div
                className={clsx(
                    "font-title relative flex cursor-pointer items-center rounded px-2 py-0.5 shadow-sm transition-all hover:scale-[96%]",
                    isActive
                        ? "bg-stone-200 dark:bg-stone-700"
                        : "bg-stone-100 dark:bg-stone-800 dark:shadow-none"
                )}
                onClick={() => {
                    setActiveKey(bucketKey);
                    setIsCollapsed(false);
                }}
            >
                {children && (
                    <svg viewBox="0 0 576 512" className="mr-1 -mt-[2px] h-4">
                        <path
                            fill="currentColor"
                            d="M152 64H296V24C296 10.75 306.7 0 320 0C333.3 0 344 10.75 344 24V64H384C419.3 64 448 92.65 448 128V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V128C0 92.65 28.65 64 64 64H104V24C104 10.75 114.7 0 128 0C141.3 0 152 10.75 152 24V64zM48 448C48 456.8 55.16 464 64 464H384C392.8 464 400 456.8 400 448V192H48V448z"
                        />
                    </svg>
                )}
                {bucketKey === "all" && (
                    <svg viewBox="0 0 576 512" className="mr-1 h-4">
                        <path
                            fill="currentColor"
                            d="M88 32C110.1 32 128 49.91 128 72V120C128 142.1 110.1 160 88 160H40C17.91 160 0 142.1 0 120V72C0 49.91 17.91 32 40 32H88zM88 72H40V120H88V72zM88 192C110.1 192 128 209.9 128 232V280C128 302.1 110.1 320 88 320H40C17.91 320 0 302.1 0 280V232C0 209.9 17.91 192 40 192H88zM88 232H40V280H88V232zM0 392C0 369.9 17.91 352 40 352H88C110.1 352 128 369.9 128 392V440C128 462.1 110.1 480 88 480H40C17.91 480 0 462.1 0 440V392zM40 440H88V392H40V440zM248 32C270.1 32 288 49.91 288 72V120C288 142.1 270.1 160 248 160H200C177.9 160 160 142.1 160 120V72C160 49.91 177.9 32 200 32H248zM248 72H200V120H248V72zM160 232C160 209.9 177.9 192 200 192H248C270.1 192 288 209.9 288 232V280C288 302.1 270.1 320 248 320H200C177.9 320 160 302.1 160 280V232zM200 280H248V232H200V280zM248 352C270.1 352 288 369.9 288 392V440C288 462.1 270.1 480 248 480H200C177.9 480 160 462.1 160 440V392C160 369.9 177.9 352 200 352H248zM248 392H200V440H248V392zM320 72C320 49.91 337.9 32 360 32H408C430.1 32 448 49.91 448 72V120C448 142.1 430.1 160 408 160H360C337.9 160 320 142.1 320 120V72zM360 120H408V72H360V120zM408 192C430.1 192 448 209.9 448 232V280C448 302.1 430.1 320 408 320H360C337.9 320 320 302.1 320 280V232C320 209.9 337.9 192 360 192H408zM408 232H360V280H408V232zM320 392C320 369.9 337.9 352 360 352H408C430.1 352 448 369.9 448 392V440C448 462.1 430.1 480 408 480H360C337.9 480 320 462.1 320 440V392zM360 440H408V392H360V440z"
                        />
                    </svg>
                )}
                {bucketKey === "1970" && (
                    <svg viewBox="0 0 576 512" className="mr-1 h-4">
                        <path
                            fill="currentColor"
                            d="M360 431.1H24c-13.25 0-24 10.76-24 24.02C0 469.2 10.75 480 24 480h336c13.25 0 24-10.76 24-24.02C384 442.7 373.3 431.1 360 431.1zM81.47 208.3L168 116.3v243.6c0 13.26 10.75 24.05 24 24.05s24-10.79 24-24.05V116.3l86.53 91.98C307.3 213.3 313.6 215.8 320 215.8c5.906 0 11.81-2.158 16.44-6.536c9.656-9.068 10.12-24.27 1.031-33.93l-128-136.1c-9.062-9.694-25.88-9.694-34.94 0l-128 136.1C37.44 185 37.91 200.2 47.56 209.3C57.19 218.4 72.38 217.1 81.47 208.3z"
                        />
                    </svg>
                )}
                <span className="flex-grow">{title}</span>

                {showChildren ? (
                    <div className="absolute right-2 flex h-full w-7 items-center justify-end">
                        <svg
                            className={clsx(
                                "w-3",
                                !isCollapsed && "rotate-180"
                            )}
                            viewBox="0 0 384 512"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsCollapsed(!isCollapsed);
                            }}
                        >
                            <path
                                fill="currentColor"
                                d="M360.5 217.5l-152 143.1C203.9 365.8 197.9 368 192 368s-11.88-2.188-16.5-6.562L23.5 217.5C13.87 208.3 13.47 193.1 22.56 183.5C31.69 173.8 46.94 173.5 56.5 182.6L192 310.9l135.5-128.4c9.562-9.094 24.75-8.75 33.94 .9375C370.5 193.1 370.1 208.3 360.5 217.5z"
                            />
                        </svg>
                    </div>
                ) : (
                    <span className="opacity-40">{articleCount}</span>
                )}
            </div>
            {showChildren && !isCollapsed && (
                <div className="ml-5 mt-1 flex flex-col gap-1">
                    {children?.map((child) => (
                        <SidebarBucketGroup
                            {...child}
                            bucketKey={child.key}
                            activeKey={activeKey}
                            setActiveKey={setActiveKey}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
