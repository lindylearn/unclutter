import dynamic from "next/dynamic";
import { LibraryModalPage } from "@unclutter/library-components/dist/components";
import { useEffect, useState } from "react";
// const LibraryModalPage = dynamic(
//     () =>
//         import(
//             "../../../common/library-components/dist/components/Modal/Modal"
//         ),
//     {
//         ssr: false,
//     }
// );

export default function ModalTestTab({}) {
    const [showModal, setShowModal] = useState(false);
    useEffect(() => {
        setTimeout(() => {
            setShowModal(true);
        }, 100);
    }, []);

    return (
        <div className="h-screen w-screen">
            <div
                className="bg-lindy m-20 mx-auto max-w-md cursor-pointer rounded-lg p-2"
                onMouseEnter={() => setShowModal(true)}
            >
                Open Library
            </div>

            <LibraryModalPage
                darkModeEnabled={true}
                isVisible={showModal}
                closeModal={() => setShowModal(false)}
            />
        </div>
    );
}
