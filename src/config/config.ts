import dotenv from "dotenv";

dotenv.config();

const accessToken = process.env.JOBVISION_ACCESS_TOKEN;
const clientId = process.env.JOBVISION_CLIENT_ID;

if (!accessToken) {
    throw new Error(
        "JOBVISION_ACCESS_TOKEN is not defined in .env"
    );
}

if (!clientId) {
    throw new Error(
        "JOBVISION_CLIENT_ID is not defined in .env"
    );
}

export const config = {
    jobvision: {
        baseURL: "https://candidateapi.jobvision.ir",
        accessToken,
        clientId,
    },
};