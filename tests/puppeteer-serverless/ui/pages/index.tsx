import { useEffect, useState } from "react";

const gcsToken =
    "ya29.a0ARrdaM8NCdcGzzhgF8QNzNUtbI51sU9leoCzuRCCBoNA98zQbs8l73MHG3V98N9dB7cK6BozmDrVTVTWUYXHp5rMpOvr0y9_aAiSK0ksSp3OEzw8YJYgGPq9AjZDD8flRe4ia7rRplWIXABiWUyExydkmuWL"; // from https://developers.google.com/oauthplayground
const bucketName = "unclutter-screenshots-serverless";

function Home() {
    const [currentScreenshots, setCurrentScreenshots] = useState([]);
    useEffect(() => {
        (async () => {
            const response = await fetch(
                `https://storage.googleapis.com/storage/v1/b/${bucketName}/o`,
                { headers: { Authorization: `Bearer ${gcsToken}` } }
            );
            const responseData = await response.json();

            setCurrentScreenshots(responseData.items);
        })();
    }, []);

    return (
        <div className="">
            <header className="text-2xl font-bold text-center mt-5">
                Unclutter Screenshot Tester
            </header>

            <main className="mt-5">
                <div></div>
                <div className="flex flex-wrap gap-5">
                    {currentScreenshots.map((file) => (
                        <Screenshot key={file.name} {...file} />
                    ))}
                </div>
            </main>
        </div>
    );
}

function Screenshot({ name }) {
    const fileName = name.split("/")[1].split(".png")[0];
    const url = decodeURIComponent(fileName);

    return (
        <a
            className="cursor-pointer hover:shadow-xl"
            href={url}
            target="_blank"
        >
            <img
                className="w-72"
                src={`https://storage.cloud.google.com/unclutter-screenshots-serverless/${name.replaceAll(
                    "%",
                    "%25"
                )}`}
            />
        </a>
    );
}

export default Home;
