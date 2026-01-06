import axios from "axios";

const externalApi = axios.create({
    headers: { "Content-Type": "application/json" }
});

export default externalApi;
