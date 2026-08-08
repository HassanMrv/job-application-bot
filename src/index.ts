import { JobVisionClient } from "./clients/jobvision.client.js";
// async function main() {
//     const jobVisionClient = new JobVisionClient();

//     const result = await jobVisionClient.searchOffers("React");

//     console.dir(result, {
//         depth: null,
//     });
// }

// main()
// // .then(() => {
// //     console.log("Request completed successfully");
// // })
// .catch((error) => {
//     console.error("Request failed:", error);
// });

async function main() {
    const jobVisionClient = new JobVisionClient();

    const details = await jobVisionClient.getJobDetails(1450906);

    console.dir(details, {
        depth: null,
    });
}

main().catch((error) => {
    console.error("Request failed:", error);
});
