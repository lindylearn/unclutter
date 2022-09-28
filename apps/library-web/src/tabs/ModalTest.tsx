import { LibraryModalPage } from "@unclutter/library-components/dist/components";
import { useEffect, useState } from "react";

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
